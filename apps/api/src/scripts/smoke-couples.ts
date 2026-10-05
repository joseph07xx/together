/**
 * Prueba el flujo completo de vinculación entre dos usuarios.
 * Uso:
 *   1. En una terminal: pnpm dev:api
 *   2. En otra:          pnpm --filter @together/api smoke:couples
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
  const email = `couple_${tag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  const r = await req(jar, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'supersecreto123', displayName: `User ${tag}` }),
  });
  if (r.status !== 201) throw new Error(`Fallo creando usuario ${tag}: ${r.status}`);
  return { jar, user: r.body.user };
}

async function main() {
  console.log(`[smoke:couples] API=${BASE}`);

  const A = await makeUser('A');
  const B = await makeUser('B');

  // 1) Ambos arrancan "single"
  {
    const r = await req(A.jar, '/couples/me');
    assert(r.status === 200 && r.body.status === 'single', 'A empieza en single');
    const r2 = await req(B.jar, '/couples/me');
    assert(r2.status === 200 && r2.body.status === 'single', 'B empieza en single');
  }

  // 2) A genera código
  let code = '';
  {
    const r = await req(A.jar, '/couples/invite', { method: 'POST' });
    assert(r.status === 201, 'A genera código → 201');
    assert(typeof r.body.code === 'string' && r.body.code.length === 6, 'Código de 6 chars');
    code = r.body.code;
  }

  // 3) A ve estado "inviting"
  {
    const r = await req(A.jar, '/couples/me');
    assert(r.status === 200 && r.body.status === 'inviting', 'A está en inviting');
    assert(r.body.code === code, 'El código mostrado coincide');
  }

  // 4) B intenta unirse con código falso
  {
    const r = await req(B.jar, '/couples/join', {
      method: 'POST',
      body: JSON.stringify({ code: 'ZZZZZZ' }),
    });
    assert(r.status === 404, 'Código inexistente → 404');
  }

  // 5) B se une con el código correcto
  {
    const r = await req(B.jar, '/couples/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    assert(r.status === 201, 'B se une → 201');
    assert(r.body.couple.userBId === B.user.id, 'B queda como userB');
    assert(r.body.couple.userAId === A.user.id, 'A queda como userA');
  }

  // 6) Ambos ven "linked"
  {
    const rA = await req(A.jar, '/couples/me');
    assert(
      rA.status === 200 && rA.body.status === 'linked',
      'A ve estado linked',
    );
    assert(rA.body.partner.id === B.user.id, 'Partner de A es B');

    const rB = await req(B.jar, '/couples/me');
    assert(
      rB.status === 200 && rB.body.status === 'linked',
      'B ve estado linked',
    );
    assert(rB.body.partner.id === A.user.id, 'Partner de B es A');
  }

  // 7) A intenta generar otro código → 409
  {
    const r = await req(A.jar, '/couples/invite', { method: 'POST' });
    assert(r.status === 409, 'A ya vinculado no puede generar código → 409');
  }

  // 8) C se intenta unir al código ya usado → 404
  {
    const C = await makeUser('C');
    const r = await req(C.jar, '/couples/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    assert(r.status === 404, 'Código ya consumido → 404');
  }

  // 9) A se desvincula
  {
    const r = await req(A.jar, '/couples/me', { method: 'DELETE' });
    assert(r.status === 204, 'A se desvincula → 204');
  }

  // 10) Ambos vuelven a "single"
  {
    const rA = await req(A.jar, '/couples/me');
    assert(rA.status === 200 && rA.body.status === 'single', 'A vuelve a single');
    const rB = await req(B.jar, '/couples/me');
    assert(rB.status === 200 && rB.body.status === 'single', 'B vuelve a single');
  }

  console.log('\n[smoke:couples] ✅ Todos los checks pasaron');
}

main().catch((err) => {
  console.error('\n[smoke:couples] ❌ Falló:', err.message);
  process.exit(1);
});