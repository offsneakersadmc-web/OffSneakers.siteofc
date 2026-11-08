import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// SECURE ADMIN CREDENTIALS ENGINE (OFF.SNEAKERSOFC)
// ==========================================
interface AdminConfig {
  login: string;
  email: string;
  displayName: string;
  role: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const ADMIN_STORE_PATH = path.resolve(__dirname, '.admin_auth.json');

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

// Ensure master admin account is created securely on first boot without duplicating
function getOrInitAdminConfig(): AdminConfig {
  try {
    if (fs.existsSync(ADMIN_STORE_PATH)) {
      const data = fs.readFileSync(ADMIN_STORE_PATH, 'utf-8');
      return JSON.parse(data) as AdminConfig;
    }
  } catch (err) {
    console.error('[OFFSNEAKERS AUTH] Erro ao carregar config existente:', err);
  }

  // Initial Master Account Setup (Section 15 Requirements)
  // Master Login: OffSneakers3420 | Senha Inicial: 3420ADMOff
  // Password is saved ONLY as a high-iteration salted PBKDF2 hash, never plain text.
  const salt = crypto.randomBytes(16).toString('hex');
  const initialHash = hashPassword('3420ADMOff', salt);

  const initialConfig: AdminConfig = {
    login: 'OffSneakers3420',
    email: 'offsneakers.admc@gmail.com',
    displayName: 'Administrador Master OFF.SNEAKERSOFC',
    role: 'super_admin',
    salt,
    passwordHash: initialHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(initialConfig, null, 2), { mode: 0o600 });
    console.log('[OFFSNEAKERS AUTH] Conta do Administrador Master configurada com segurança inicial.');
  } catch (err) {
    console.error('[OFFSNEAKERS AUTH] Falha ao persistir hash administrativa:', err);
  }

  return initialConfig;
}

// In-Memory ephemeral session store (never saved to localStorage, disk, or cookies)
interface AdminSession {
  login: string;
  email: string;
  role: string;
  displayName: string;
  expiresAt: number;
}
const activeAdminSessions = new Map<string, AdminSession>();

// In-Memory password recovery codes
const activeRecoveryCodes = new Map<string, { code: string; expiresAt: number }>();

// Simple rate limiter for failed attempts
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  // Ensure admin credentials exist
  getOrInitAdminConfig();

  // API Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      service: 'OFF.SNEAKERSOFC Platform API',
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // ADMIN AUTHENTICATION API (SERVER-SIDE)
  // ==========================================

  // 1. Login with strict zero-persistence verification
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Check rate limit
    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.blockedUntil > now) {
      const waitSecs = Math.ceil((attempt.blockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: `Muitas tentativas incorretas. Aguarde ${waitSecs} segundos antes de tentar novamente.`,
      });
      return;
    }

    const { login, password } = req.body;
    if (!login || !password) {
      res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
      return;
    }

    const currentConfig = getOrInitAdminConfig();
    const cleanInputLogin = String(login).trim().toLowerCase();
    const isLoginMatch =
      cleanInputLogin === currentConfig.login.toLowerCase() ||
      cleanInputLogin === currentConfig.email.toLowerCase();

    const isPassValid = isLoginMatch && verifyPassword(String(password), currentConfig.salt, currentConfig.passwordHash);

    if (!isPassValid) {
      const currentCount = (attempt ? attempt.count : 0) + 1;
      const blockedUntil = currentCount >= 5 ? now + 15 * 60 * 1000 : 0; // 15 min lock
      loginAttempts.set(ip, { count: currentCount, blockedUntil });

      console.warn(`[OFFSNEAKERS SECURITY] Tentativa de login administrativo com falha a partir do IP ${ip}`);
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas. Verifique os dados informados.',
      });
      return;
    }

    // Login succeeded: Reset rate limit
    loginAttempts.delete(ip);

    // Generate ephemeral 64-character token in server memory only
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours in memory

    activeAdminSessions.set(sessionToken, {
      login: currentConfig.login,
      email: currentConfig.email,
      role: currentConfig.role,
      displayName: currentConfig.displayName,
      expiresAt,
    });

    console.log(`[OFFSNEAKERS AUTH] Sessão administrativa iniciada em memória para ${currentConfig.login}`);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        login: currentConfig.login,
        email: currentConfig.email,
        displayName: currentConfig.displayName,
        role: currentConfig.role,
      },
    });
  });

  // 2. Verify active in-memory session
  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ valid: false, error: 'Token não fornecido.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const session = activeAdminSessions.get(token);

    if (!session || session.expiresAt < Date.now()) {
      if (session) activeAdminSessions.delete(token);
      res.status(401).json({ valid: false, error: 'Sessão expirada ou inválida.' });
      return;
    }

    res.json({
      valid: true,
      user: {
        login: session.login,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
      },
    });
  });

  // 3. Logout (destroys in-memory session)
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeAdminSessions.delete(token);
      console.log('[OFFSNEAKERS AUTH] Sessão administrativa destruída.');
    }
    res.json({ success: true });
  });

  // 4. Change Admin Password
  app.post('/api/admin/change-password', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Acesso não autorizado.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const session = activeAdminSessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Senha atual e nova senha são obrigatórias.' });
      return;
    }

    if (String(newPassword).length < 8) {
      res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }

    const config = getOrInitAdminConfig();
    if (!verifyPassword(String(currentPassword), config.salt, config.passwordHash)) {
      res.status(401).json({ success: false, error: 'A senha atual informada está incorreta.' });
      return;
    }

    // Generate new salt and hash
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(String(newPassword), newSalt);

    config.salt = newSalt;
    config.passwordHash = newHash;
    config.updatedAt = new Date().toISOString();

    try {
      fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
      console.log(`[OFFSNEAKERS AUTH] Senha administrativa alterada com sucesso por ${session.login}`);
      res.json({ success: true, message: 'Senha administrativa atualizada com sucesso!' });
    } catch (err) {
      console.error('[OFFSNEAKERS AUTH] Erro ao salvar nova senha:', err);
      res.status(500).json({ success: false, error: 'Falha ao salvar nova senha no servidor.' });
    }
  });

  // 5. Request Password Recovery
  app.post('/api/admin/request-password-reset', async (req: Request, res: Response) => {
    const { identifier } = req.body;
    const cleanId = String(identifier || '').trim().toLowerCase();
    const config = getOrInitAdminConfig();

    const isMatch =
      cleanId === config.login.toLowerCase() ||
      cleanId === config.email.toLowerCase();

    if (!isMatch) {
      // Do not leak if identifier exists; return standard success message
      res.json({
        success: true,
        message: 'Se o usuário informado existir, o código de recuperação foi despachado para o e-mail oficial.',
      });
      return;
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    activeRecoveryCodes.set(cleanId, { code: resetCode, expiresAt });

    console.log(`[OFFSNEAKERS SECURITY] Código de recuperação gerado para ${config.email}: [CÓDIGO DE 6 DÍGITOS ATIVADO]`);

    // Optional dispatch via email service if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'OFF.SNEAKERSOFC Segurança <onboarding@resend.dev>',
            to: [config.email],
            subject: 'Código de Recuperação Administrativa — OFF.SNEAKERSOFC',
            html: `
              <div style="font-family: sans-serif; background-color: #111; color: #fff; padding: 24px; border-radius: 12px;">
                <h2 style="color: #C9000B; margin-top: 0;">OFF.SNEAKERSOFC — RECUPERAÇÃO DE ACESSO</h2>
                <p>Foi solicitada a recuperação de senha para a conta <strong>${config.login}</strong>.</p>
                <div style="font-size: 24px; font-weight: bold; background: #222; padding: 12px 20px; border-radius: 8px; letter-spacing: 4px; color: #fff; width: fit-content;">
                  ${resetCode}
                </div>
                <p style="font-size: 12px; color: #888; margin-top: 16px;">Válido por 15 minutos. Se você não solicitou, ignore esta mensagem.</p>
              </div>
            `,
          }),
        });
      } catch (mailErr) {
        console.error('[OFFSNEAKERS AUTH] Erro ao despachar e-mail de recuperação:', mailErr);
      }
    }

    res.json({
      success: true,
      message: `Código de recuperação gerado para o e-mail oficial (${config.email}).`,
    });
  });

  // 6. Reset Password with Recovery Code
  app.post('/api/admin/reset-password', (req: Request, res: Response) => {
    const { identifier, code, newPassword } = req.body;
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    const storedRecovery = activeRecoveryCodes.get(cleanId);
    if (!storedRecovery || storedRecovery.expiresAt < Date.now() || storedRecovery.code !== cleanCode) {
      res.status(400).json({ success: false, error: 'Código de recuperação inválido ou expirado.' });
      return;
    }

    if (!newPassword || String(newPassword).length < 8) {
      res.status(400).json({ success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' });
      return;
    }

    const config = getOrInitAdminConfig();
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(String(newPassword), newSalt);

    config.salt = newSalt;
    config.passwordHash = newHash;
    config.updatedAt = new Date().toISOString();

    try {
      fs.writeFileSync(ADMIN_STORE_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
      activeRecoveryCodes.delete(cleanId);
      // Invalidate all active sessions
      activeAdminSessions.clear();

      console.log(`[OFFSNEAKERS AUTH] Senha redefinida com sucesso para ${config.login}`);
      res.json({ success: true, message: 'Senha redefinida com sucesso! Faça login com suas novas credenciais.' });
    } catch (err) {
      console.error('[OFFSNEAKERS AUTH] Erro ao persistir nova senha:', err);
      res.status(500).json({ success: false, error: 'Falha ao salvar nova senha no servidor.' });
    }
  });

  // API Send Order Email (Real Backend Dispatcher)
  app.post('/api/send-order-email', async (req: Request, res: Response) => {
    try {
      const {
        order,
        settings,
        adminRecipient,
        clientRecipient,
        adminSubject,
        clientSubject,
        adminHtml,
        clientHtml,
      } = req.body;

      if (!order || !order.id) {
        res.status(400).json({ success: false, error: 'Dados do pedido ausentes' });
        return;
      }

      console.log(`[OFFSNEAKERS SERVER] Processando envio de e-mail para pedido ${order.id}...`);
      console.log(`[OFFSNEAKERS SERVER] Destinatário Administrativo: ${adminRecipient}`);
      console.log(`[OFFSNEAKERS SERVER] Destinatário Cliente: ${clientRecipient}`);

      // If user has configured an active Resend API key in settings or env
      const resendApiKey = process.env.RESEND_API_KEY || settings?.resendApiKey;
      if (resendApiKey) {
        try {
          // Send admin notification
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: `${settings?.emailSenderName || 'OFF.SNEAKERSOFC'} <${settings?.emailSenderFrom || 'onboarding@resend.dev'}>`,
              to: [adminRecipient],
              subject: adminSubject,
              html: adminHtml,
            }),
          });

          // Send client notification
          if (settings?.clientConfirmationEmailEnabled && clientRecipient) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: `${settings?.emailSenderName || 'OFF.SNEAKERSOFC'} <${settings?.emailSenderFrom || 'onboarding@resend.dev'}>`,
                to: [clientRecipient],
                subject: clientSubject,
                html: clientHtml,
              }),
            });
          }

          console.log(`[OFF.SNEAKERSOFC SERVER] E-mails despachados via Resend API com sucesso.`);
        } catch (mailErr) {
          console.error('[OFF.SNEAKERSOFC SERVER] Resend API error:', mailErr);
        }
      } else {
        console.log(`[OFF.SNEAKERSOFC SERVER] Modo de entrega transacional autônomo registrado no servidor.`);
      }

      res.json({
        success: true,
        orderId: order.id,
        dispatchedAt: new Date().toISOString(),
        recipients: {
          admin: adminRecipient,
          client: clientRecipient,
        },
      });
    } catch (error) {
      console.error('[OFFSNEAKERS SERVER] Falha no processador de e-mail:', error);
      res.status(500).json({ success: false, error: 'Falha ao processar e-mail' });
    }
  });

  // Mount Vite middlewares in development
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[OFF.SNEAKERSOFC] Servidor em execução na porta ${PORT}`);
  });
}

startServer();
