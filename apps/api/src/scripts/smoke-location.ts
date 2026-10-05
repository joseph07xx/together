/**
 * Prueba el flujo de ubicación y privacidad.
 * Uso: pnpm --filter @together/api smoke:location
 */

const BASE = process.env.API_URL ?? 'http://localhost:4000';

type Jar = { cookies: Map<string, string> };

function storeSetCookie(jar: Jar, setCookie: string | null): void {
  if (!setCookie) return;
  const parts = setCookie.split(/,(?=[^;]+=[^;]+)/g);
  for (const raw of parts) {
    const [pair] = raw.split(';');
    const [name, ...rest] = pair!.trim().split('=');
    if (!name) continue;
    jar.cookies.set(name, rest.join('='));
  }
}

function cookieHeader(jar: Jar): string {
  return [...jar.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function req(
  jar: Jar,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  const c = cookieHeader(jar);
  if (c) headers.set('cookie', c);

  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: 'manual' });
  storeSetCookie(jar, res.headers.get('set-cookie'));

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`❌ ${msg}`);
  console.log(`✔ ${msg}`);
}

async function makeUser(tag: string): Promise<{ jar: Jar; user: any }> {
  const jar: Jar = { cookies: new Map() };
  const email = `loc_${tag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  const r = await req(jar, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'supersecreto123', displayName: `User ${tag}` }),
  });
  if (r.status !== 201) throw new Error(`Fallo creando usuario ${tag}`);
  return { jar, user: r.body.user };
}

async function link(A: Jar, B: Jar) {
  const inv = await req(A, '/couples/invite', { method: 'POST' });
  await req(B, '/couples/join', {
    method: 'POST',
    body: JSON.stringify({ code: inv.body.code }),
  });
}

async function main() {
  console.log(`[smoke:location] API=${BASE}`);

  const A = await makeUser('A');
  const B = await makeUser('B');
  await link(A.jar, B.jar);

  // 1) Privacidad por defecto: shareLocation=false
  {
    const r = await req(A.jar, '/privacy/me');
    assert(r.status === 200, 'GET /privacy/me → 200');
    assert(r.body.privacy.shareLocation === false, 'shareLocation=false por defecto');
    assert(r.body.privacy.paused === false, 'paused=false por defecto');
  }

  // 2) A intenta PUT /location sin activar → 403
  {
    const r = await req(A.jar, '/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude: 19.4326, longitude: -99.1332 }),
    });
    assert(r.status === 403, 'PUT /location sin permiso → 403');
  }

  // 3) A activa shareLocation
  {
    const r = await req(A.jar, '/privacy', {
      method: 'PUT',
      body: JSON.stringify({ shareLocation: true }),
    });
    assert(r.status === 200 && r.body.privacy.shareLocation === true, 'shareLocation activado');
  }

  // 4) A envía ubicación → 200 con placeLabel (o null si Nominatim falla)
  {
    const r = await req(A.jar, '/location', {
      method: 'PUT',
      body: JSON.stringify({
        latitude: 19.4326,
        longitude: -99.1332,
        accuracy: 15,
      }),
    });
    assert(r.status === 200, 'PUT /location → 200');
    assert(typeof r.body.location.latitude === 'number', 'Latitude guardada');
    assert(typeof r.body.location.updatedAt === 'string', 'updatedAt presente');
    // placeLabel puede ser null si Nominatim falla; lo aceptamos
    console.log(`  · placeLabel = ${JSON.stringify(r.body.location.placeLabel)}`);
  }

  // 5) B ve la ubicación de A
  {
    const r = await req(B.jar, '/location/partner');
    assert(r.status === 200 && r.body.shared === true, 'B ve ubicación de A');
    assert(Math.abs(r.body.location.latitude - 19.4326) < 0.001, 'Latitude correcta');
  }

  // 6) A pausa compartir
  {
    const r = await req(A.jar, '/privacy', {
      method: 'PUT',
      body: JSON.stringify({ paused: true }),
    });
    assert(r.status === 200 && r.body.privacy.paused === true, 'A pausa compartir');
  }

  // 7) B ya no ve la ubicación de A (paused)
  {
    const r = await req(B.jar, '/location/partner');
    assert(r.status === 200 && r.body.shared === false, 'B no ve ubicación por paused');
    assert(r.body.reason === 'paused', 'reason=paused');
  }

  // 8) B ya no ve el estado de A (paused)
  {
    const r = await req(B.jar, '/status/partner');
    assert(r.status === 200 && r.body.shared === false, 'B no ve estado por paused');
    assert(r.body.reason === 'paused', 'reason=paused en status');
  }

  // 9) A intenta enviar ubicación con paused → 403
  {
    const r = await req(A.jar, '/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude: 19.44, longitude: -99.14 }),
    });
    assert(r.status === 403, 'PUT /location con paused → 403');
  }

  // 10) A reanuda y desactiva shareLocation
  {
    await req(A.jar, '/privacy', {
      method: 'PUT',
      body: JSON.stringify({ paused: false, shareLocation: false }),
    });
    const r = await req(B.jar, '/location/partner');
    assert(r.status === 200 && r.body.shared === false, 'B no ve ubicación si shareLocation=false');
    assert(r.body.reason === 'partner_hidden', 'reason=partner_hidden');
  }

  // 11) Presence básica
  {
    const r = await req(B.jar, '/location/partner/presence');
    assert(r.status === 200, 'GET presence → 200');
    assert(r.body.shared === true, 'Presence compartida por defecto');
    assert(typeof r.body.online === 'boolean', 'online es booleano');
  }

  // 12) A desactiva shareLastSeen
  {
    await req(A.jar, '/privacy', {
      method: 'PUT',
      body: JSON.stringify({ shareLastSeen: false }),
    });
    const r = await req(B.jar, '/location/partner/presence');
    assert(r.body.shared === false && r.body.reason === 'partner_hidden', 'Presence oculta');
  }

  console.log('\n[smoke:location] ✅ Todos los checks pasaron');
}

main().catch((err) => {
  console.error('\n[smoke:location] ❌ Falló:', err.message);
  process.exit(1);
});