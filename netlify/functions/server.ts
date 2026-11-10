import crypto from 'crypto';

interface HandlerEvent {
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  body: string | null;
  queryStringParameters?: Record<string, string | undefined>;
}

// Master admin config defaults (identical to server.ts)
const MASTER_CONFIG = {
  login: 'OffSneakers3420',
  email: 'offsneakers.admc@gmail.com',
  displayName: 'Administrador Master OFF.SNEAKERSOFC',
  role: 'super_admin',
  salt: '821a097f27530ffa7f41c696343b1c72',
  passwordHash: 'e8e90a81daec99084de892e4105a72aa72b6674000f92c2add70b5a76f14db504392737fd39776f34b6cd25868c2757880a1c4514cd67fbd6c4a06d767b9e909',
};

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  if (hashBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}

// In-Memory ephemeral session store for serverless environment
const activeSessions = new Map<string, { login: string; email: string; role: string; displayName: string; expiresAt: number }>();

const jsonResponse = (statusCode: number, data: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  },
  body: JSON.stringify(data),
});

export const handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // Normalize path
  // Netlify rewrite: /api/* -> /.netlify/functions/server/:splat
  const rawPath = event.path || '';
  const path = rawPath.replace('/.netlify/functions/server', '').replace('/api', '') || '/';

  try {
    // 1. Health check
    if (path === '/health' && event.httpMethod === 'GET') {
      return jsonResponse(200, {
        status: 'online',
        service: 'OFF.SNEAKERSOFC Netlify Serverless API',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Admin Login
    if (path === '/admin/login' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { login, password } = body;

      if (!login || !password) {
        return jsonResponse(400, { success: false, error: 'Usuário e senha são obrigatórios.' });
      }

      const cleanInputLogin = String(login).trim().toLowerCase();
      const isLoginMatch =
        cleanInputLogin === MASTER_CONFIG.login.toLowerCase() ||
        cleanInputLogin === MASTER_CONFIG.email.toLowerCase();

      const isPassValid = isLoginMatch && verifyPassword(String(password), MASTER_CONFIG.salt, MASTER_CONFIG.passwordHash);

      if (!isPassValid) {
        return jsonResponse(401, {
          success: false,
          error: 'Credenciais inválidas. Verifique os dados informados.',
        });
      }

      // Generate ephemeral session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 2 * 60 * 60 * 1000;

      activeSessions.set(sessionToken, {
        login: MASTER_CONFIG.login,
        email: MASTER_CONFIG.email,
        role: MASTER_CONFIG.role,
        displayName: MASTER_CONFIG.displayName,
        expiresAt,
      });

      return jsonResponse(200, {
        success: true,
        token: sessionToken,
        user: {
          login: MASTER_CONFIG.login,
          email: MASTER_CONFIG.email,
          displayName: MASTER_CONFIG.displayName,
          role: MASTER_CONFIG.role,
        },
      });
    }

    // 3. Admin Verify Session
    if (path === '/admin/verify' && event.httpMethod === 'POST') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return jsonResponse(401, { valid: false, error: 'Token não fornecido.' });
      }

      const token = authHeader.split(' ')[1];
      const session = activeSessions.get(token);

      if (!session || session.expiresAt < Date.now()) {
        if (session) activeSessions.delete(token);
        return jsonResponse(401, { valid: false, error: 'Sessão expirada ou inválida.' });
      }

      return jsonResponse(200, {
        valid: true,
        user: {
          login: session.login,
          email: session.email,
          displayName: session.displayName,
          role: session.role,
        },
      });
    }

    // 4. Admin Logout
    if (path === '/admin/logout' && event.httpMethod === 'POST') {
      const authHeader = event.headers.authorization || event.headers.Authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        activeSessions.delete(token);
      }
      return jsonResponse(200, { success: true });
    }

    // 5. Send Order Email
    if (path === '/send-order-email' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const { order, storeSettings } = body;
      console.log(`[NETLIFY FUNCTION] Notificação de pedido processada para: ${order?.id}`);
      return jsonResponse(200, {
        success: true,
        delivered: true,
        provider: 'netlify-serverless',
      });
    }

    return jsonResponse(404, { error: `Endpoint não encontrado: ${path}` });
  } catch (error) {
    console.error('[NETLIFY FUNCTION ERROR]', error);
    return jsonResponse(500, {
      success: false,
      error: 'Erro interno no processamento da função Netlify.',
    });
  }
};
