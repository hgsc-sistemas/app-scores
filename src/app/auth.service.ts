import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

export interface AuthData {
  role: 'team' | 'admin';
  expiresAt: number;
}

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAhNogDXqMul1zQpTXsfGns99CE8vaJEZA',
  authDomain: 'itga-scores.firebaseapp.com',
  projectId: 'itga-scores',
  storageBucket: 'itga-scores.firebasestorage.app',
  messagingSenderId: '207503990108',
  appId: '1:207503990108:web:7b72e44452beaffecbf599',
};

export const AUTH_STORAGE_KEY = 'hgsc_auth';
export const AUTH_VALIDITY_DAYS = 15;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // Inicialização segura do Firebase (singleton)
  private readonly firebaseApp = getApps().length
    ? getApp()
    : initializeApp(FIREBASE_CONFIG);

  private readonly db = getFirestore(this.firebaseApp);

  /** Signal reativo com os dados da sessão do usuário atual */
  public readonly currentUser = signal<AuthData | null>(this.getStoredAuth());

  /**
   * Autentica o usuário validando a senha contra o documento config/passwords no Firestore.
   * Se for válida, persiste a sessão no localStorage por 15 dias (para uso offline).
   */
  public async login(password: string): Promise<boolean> {
    if (!password || !password.trim()) {
      return false;
    }

    try {
      const docRef = doc(this.db, 'config', 'passwords');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.error('Documento config/passwords não encontrado no Firestore.');
        return false;
      }

      const data = docSnap.data();
      const trimmedPassword = password.trim();

      let role: 'team' | 'admin' | null = null;

      if (data?.['adminPassword'] && trimmedPassword === String(data['adminPassword']).trim()) {
        role = 'admin';
      } else if (data?.['teamPassword'] && trimmedPassword === String(data['teamPassword']).trim()) {
        role = 'team';
      }

      if (!role) {
        return false;
      }

      const expiresAt = Date.now() + AUTH_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
      const authData: AuthData = { role, expiresAt };

      this.saveAuth(authData);
      this.currentUser.set(authData);
      return true;
    } catch (error) {
      console.error('Erro ao autenticar no Firestore:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário está autenticado e com token válido no localStorage.
   */
  public isAuthenticated(): boolean {
    const auth = this.getStoredAuth();
    if (!auth) {
      return false;
    }

    if (Date.now() > auth.expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Encerra a sessão, limpando o localStorage e redirecionando para /login.
   */
  public logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Retorna o papel do usuário autenticado ('team' ou 'admin').
   */
  public getRole(): 'team' | 'admin' | null {
    const auth = this.currentUser();
    return auth ? auth.role : null;
  }

  /**
   * Atualiza as senhas de equipe e/ou administrador no Firestore.
   * Aponta para o documento config/passwords.
   */
  public async updatePasswords(
    newTeamPassword?: string,
    newAdminPassword?: string,
  ): Promise<boolean> {
    const updatePayload: Record<string, string> = {};

    if (newTeamPassword && newTeamPassword.trim()) {
      updatePayload['teamPassword'] = newTeamPassword.trim();
    }

    if (newAdminPassword && newAdminPassword.trim()) {
      updatePayload['adminPassword'] = newAdminPassword.trim();
    }

    if (Object.keys(updatePayload).length === 0) {
      return false;
    }

    try {
      const docRef = doc(this.db, 'config', 'passwords');
      await updateDoc(docRef, updatePayload);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar senhas no Firestore:', error);
      return false;
    }
  }

  private saveAuth(authData: AuthData): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch (err) {
        console.error('Falha ao salvar sessão localmente:', err);
      }
    }
  }

  private getStoredAuth(): AuthData | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as AuthData;
      if (!parsed || !parsed.expiresAt || !parsed.role) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (err) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }
}
