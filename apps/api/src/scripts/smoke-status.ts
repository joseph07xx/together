/**
 * Prueba el flujo de estado: propio + de pareja + privacidad.
 * Uso:
 *   1. pnpm dev:api
 *   2. pnpm --filter @together/api smoke:status
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
  const email = `status_${tag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  const r = await req(jar, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'supersecreto123', displayName: `User ${tag}` }),
  });
  if (r.status !== 201) throw new Error(`Fallo creando usuario ${tag}: ${r.status}`);
  return { jar, user: r.body.user };
}

async function linkCouple(A: Jar, B: Jar) {
  const inv = await req(A, '/couples/invite', { method: 'POST' });
  const code = inv.body.code;
  const join = await req(B, '/couples/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (join.status !== 201) throw new Error('No se pudo vincular');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[smoke:status] API=${BASE}`);

  const A = await makeUser('A');
  const B = await makeUser('B');
  await linkCouple(A.jar, B.jar);

  // 1) Sin estado → null
  {
    const r = await req(A.jar, '/status/me');
    assert(r.status === 200 && r.body.status === null, 'Sin estado → null');
  }

  // 2) A pone "Estudiando"
  let aStart: string;
  {
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'studying' }),
    });
    assert(r.status === 200, 'PUT /status → 200');
    assert(r.body.status.key === 'studying', 'Key correcta');
    assert(r.body.status.emoji === '📚', 'Emoji rellenado desde catálogo');
    assert(r.body.status.label === 'Estudiando', 'Label rellenado desde catálogo');
    aStart = r.body.status.startedAt;
  }

  // 3) B ve el estado de A (compartido por defecto)
  {
    const r = await req(B.jar, '/status/partner');
    assert(r.status === 200, 'B consulta estado de A → 200');
    assert(r.body.shared === true, 'Estado compartido');
    assert(r.body.status.key === 'studying', 'B ve "studying"');
  }

  // 4) A repite mismo key → startedAt se preserva
  {
    await sleep(1100); // aseguramos que el reloj avanza
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'studying' }),
    });
    assert(r.body.status.startedAt === aStart, 'startedAt preservado si no cambia key');
  }

  // 5) A cambia a "working" → startedAt se resetea
  {
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'working' }),
    });
    assert(r.body.status.key === 'working', 'Cambio a working');
    assert(r.body.status.startedAt !== aStart, 'startedAt reset al cambiar key');
  }

  // 6) A pone "custom"
  {
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'custom', emoji: '☕', label: 'Café con la abuela' }),
    });
    assert(r.status === 200, 'Custom aceptado');
    assert(r.body.status.emoji === '☕' && r.body.status.label === 'Café con la abuela', 'Custom guardado');
  }

  // 7) Custom sin label → 400
  {
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'custom', emoji: '☕' }),
    });
    assert(r.status === 400, 'Custom sin label → 400');
  }

  // 8) Key desconocida → 400 (validación Zod)
  {
    const r = await req(A.jar, '/status', {
      method: 'PUT',
      body: JSON.stringify({ key: 'inventado' }),
    });
    assert(r.status === 400, 'Key desconocida → 400');
  }

  // 9) B desactiva shareStatus → A no lo ve
  {
    // Aprovechamos que la privacidad se crea en el registro y la actualizamos
    // directamente por un endpoint que existirá en el Paso 6; mientras,
    // usamos el endpoint de "pausar" que también llega en el Paso 6.
    // Para no adelantar trabajo, en este smoke simulamos con una escritura
    // a BD vía un endpoint interno? No — mejor: dejamos esto para el Paso 6.
    // Aquí solo verificamos que shareStatus por defecto permite ver.
    console.log('· (shareStatus off → cubierto en Paso 6)');
  }

  console.log('\n[smoke:status] ✅ Todos los checks pasaron');
}

main().catch((err) => {
  console.error('\n[smoke:status] ❌ Falló:', err.message);
  process.exit(1);
});