/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut
} from 'firebase/auth';

export interface AdminUser {
  login: string;
  email: string;
  displayName: string;
  role: string;
}

interface EphemeralSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
}

// Master credential constants (Salted PBKDF2 hash - never plain text)
const MASTER_LOGIN = 'OffSneakers3420';
const MASTER_EMAIL = 'offsneakers.admc@gmail.com';
const MASTER_DISPLAY_NAME = 'Administrador Master OFF.SNEAKERSOFC';
const MASTER_ROLE = 'super_admin';
const MASTER_SALT = '821a097f27530ffa7f41c696343b1c72';
const MASTER_HASH = 'e8e90a81daec99084de892e4105a72aa72b6674000f92c2add70b5a76f14db504392737fd39776f34b6cd25868c2757880a1c4514cd67fbd6c4a06d767b9e909';

// In-Memory ONLY: strictly conforms to Section 16 requirements.
// Zero storage in localStorage, sessionStorage, or cookies.
let inMemorySession: EphemeralSession | null = null;

/**
 * Native Browser WebCrypto PBKDF2 verification (SHA-512, 100,000 iterations).
 * Matches server.ts PBKDF2 execution with UTF-8 salt representation.
 */
async function verifyWebCryptoHash(password: string, saltStr: string, expectedHash: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltStr),
        iterations: 100000,
        hash: 'SHA-512',
      },
      keyMaterial,
      512
    );

    const derivedHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return derivedHex === expectedHash;
  } catch (err) {
    console.warn('[OFF.SNEAKERSOFC AUTH] WebCrypto PBKDF2 warning:', err);
    return false;
  }
}

export class AdminAuthService {
  /**
   * Performs multi-tier admin authentication:
   * 1. Attempts Server/Netlify Functions API endpoint (/api/admin/login).
   * 2. If unreachable (e.g. Netlify static hosting), attempts direct Firebase Authentication with in-memory persistence.
   * 3. If Firebase email/password provider is unconfigured, performs WebCrypto PBKDF2 verification against the salted master hash.
   */
  async login(loginInput: string, passwordInput: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    const cleanLogin = loginInput.trim();
    const cleanPassword = passwordInput;

    if (!cleanLogin || !cleanPassword) {
      return { success: false, error: 'Usuário e senha são obrigatórios.' };
    }

    // Tier 1: Try Server or Netlify Serverless Function
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: cleanLogin, password: cleanPassword }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok && data.success && data.token) {
          inMemorySession = {
            token: data.token,
            user: data.user,
            expiresAt: Date.now() + 2 * 60 * 60 * 1000,
          };
          // Try to initialize Firebase Auth session
          this.initFirebaseAuth(cleanPassword).catch(() => {});
          return { success: true, user: data.user };
        } else if (response.status === 401 || response.status === 429) {
          return { success: false, error: data.error || 'Credenciais inválidas. Verifique os dados informados.' };
        }
      }
    } catch {
      // Backend / serverless function not reachable, proceed to client-side verification
    }

    // Tier 2: Validate username format match
    const isLoginMatch =
      cleanLogin.toLowerCase() === MASTER_LOGIN.toLowerCase() ||
      cleanLogin.toLowerCase() === MASTER_EMAIL.toLowerCase();

    if (!isLoginMatch) {
      return { success: false, error: 'Credenciais inválidas. Verifique os dados informados.' };
    }

    // Tier 3: Verify via Web Crypto PBKDF2 against master salted hash
    const isValid = await verifyWebCryptoHash(cleanPassword, MASTER_SALT, MASTER_HASH);
    if (!isValid) {
      return { success: false, error: 'Credenciais inválidas. Verifique os dados informados.' };
    }

    // Password is valid! Establish ephemeral in-memory session
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    const ephemeralToken = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    const user: AdminUser = {
      login: MASTER_LOGIN,
      email: MASTER_EMAIL,
      displayName: MASTER_DISPLAY_NAME,
      role: MASTER_ROLE,
    };

    inMemorySession = {
      token: ephemeralToken,
      user,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    };

    // Ensure Firebase Auth session is connected
    await this.initFirebaseAuth(cleanPassword);

    return { success: true, user };
  }

  /**
   * Initializes Firebase Auth in-memory session (never persisted to disk/localStorage)
   */
  private async initFirebaseAuth(password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, MASTER_EMAIL, password);
    } catch {
      // If email/password provider is not toggled in Firebase console, authenticate anonymously
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (anonErr) {
        console.warn('[OFF.SNEAKERSOFC AUTH] Firebase Auth fallback notice:', anonErr);
      }
    }
  }

  /**
   * Logs out the administrator and clears all in-memory references.
   */
  async logout(): Promise<void> {
    const token = inMemorySession?.token;
    inMemorySession = null;

    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore
    }

    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
  }

  /**
   * Returns current active user if session is valid in memory.
   */
  getCurrentUser(): AdminUser | null {
    if (!inMemorySession) return null;
    if (Date.now() > inMemorySession.expiresAt) {
      inMemorySession = null;
      return null;
    }
    return inMemorySession.user;
  }

  /**
   * Returns ephemeral session token.
   */
  getSessionToken(): string | null {
    if (!inMemorySession) return null;
    if (Date.now() > inMemorySession.expiresAt) {
      inMemorySession = null;
      return null;
    }
    return inMemorySession.token;
  }

  /**
   * Checks if admin is actively authenticated.
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const adminAuthService = new AdminAuthService();
