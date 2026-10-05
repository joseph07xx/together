/**
 * Prueba el flujo completo de autenticación contra el servidor de desarrollo.
 * Uso:
 *   1. En una terminal: pnpm dev:api
 *   2. En otra:          pnpm --filter @together/api smoke:auth
 */

const BASE = process.env.API_URL ?? 'http://localhost:4000';

type Jar = { cookies: Map<string, string> };

function storeSetCookie(jar: Jar, setCookie: string | null): void {
  if (!setCookie) return;
  // Soporta varios Set-Cookie separados por coma (simplificación: extraemos pares clave=valor)
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

  const setCookie = res.headers.get('set-cookie');
  storeSetCookie(jar, setCookie);

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

async function main() {
  const jar: Jar = { cookies: new Map() };
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'supersecreto123';
  const displayName = 'Smoke Tester';

  console.log(`[smoke:auth] API=${BASE}`);

  // 1) Health
  {
    const r = await req(jar, '/health');
    assert(r.status === 200 && r.body?.ok === true, 'GET /health responde ok');
  }

  // 2) Registro
  {
    const r = await req(jar, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    assert(r.status === 201, 'POST /auth/register → 201');
    assert(r.body?.user?.email === email, 'El usuario devuelto coincide');
    assert(jar.cookies.has('together_at'), 'Cookie access emitida');
    assert(jar.cookies.has('together_rt'), 'Cookie refresh emitida');
  }

  // 3) Registro duplicado
  {
    const r = await req(jar, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    assert(r.status === 409, 'Registro duplicado → 409');
  }

  // 4) /auth/me con cookie
  {
    const r = await req(jar, '/auth/me');
    assert(r.status === 200 && r.body?.user?.email === email, 'GET /auth/me con cookie');
    assert(r.body?.user?.privacy?.shareStatus === true, 'Privacy creada con defaults');
  }

  // 5) Refresh (rotación)
  {
    const oldAccess = jar.cookies.get('together_at');
    const r = await req(jar, '/auth/refresh', { method: 'POST' });
    assert(r.status === 200, 'POST /auth/refresh → 200');
    assert(jar.cookies.get('together_at') !== oldAccess, 'Access token rotado');
  }

  // 6) Logout
  {
    const r = await req(jar, '/auth/logout', { method: 'POST' });
    assert(r.status === 204, 'POST /auth/logout → 204');
    jar.cookies.clear();
  }

  // 7) /auth/me sin cookie
  {
    const r = await req(jar, '/auth/me');
    assert(r.status === 401, 'GET /auth/me sin cookie → 401');
  }

  // 8) Login correcto
  {
    const r = await req(jar, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    assert(r.status === 200, 'POST /auth/login → 200');
    assert(jar.cookies.has('together_at'), 'Cookie access emitida tras login');
  }

  // 9) Login incorrecto
  {
    const emptyJar: Jar = { cookies: new Map() };
    const r = await req(emptyJar, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });
    assert(r.status === 401, 'Login con password incorrecta → 401');
  }

  console.log('\n[smoke:auth] ✅ Todos los checks pasaron');
}

main().catch((err) => {
  console.error('\n[smoke:auth] ❌ Falló:', err.message);
  process.exit(1);
});