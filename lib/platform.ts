
/**
 * Platform Storage SDK
 */

export interface UserInfo {
  id: string;
  name?: string;
}

export function checkIsOnPlatform(): boolean {
  return document.cookie.includes('X-Platform=1');
}

class PlatformStorage {
  private _isOnPlatform: boolean | null = null;
  private _user: UserInfo | null = null;
  private readonly localPrefix: string;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.localPrefix = '__ps__:';
  }

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._detect();
    return this.initPromise;
  }

  private async _detect(): Promise<void> {
    if (!checkIsOnPlatform()) {
      this._isOnPlatform = false;
      this._user = { id: 'local-user', name: 'Local User' };
      return;
    }

    try {
      const res = await fetch('/api/storage/user', { credentials: 'include' });
      if (res.ok) {
        this._user = await res.json();
        this._isOnPlatform = true;
      } else if (res.status === 401) {
        this._isOnPlatform = true;
        this._user = null;
      } else {
        this._isOnPlatform = false;
        this._user = { id: 'local-user', name: 'Local User' };
      }
    } catch {
      this._isOnPlatform = false;
      this._user = { id: 'local-user', name: 'Local User' };
    }
  }

  private async ensureInit(): Promise<void> {
    if (this._isOnPlatform === null) {
      await this.init();
    }
  }

  async isOnPlatform(): Promise<boolean> {
    await this.ensureInit();
    return this._isOnPlatform!;
  }

  async getUser(): Promise<UserInfo | null> {
    await this.ensureInit();
    return this._user;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.ensureInit();
    if (!this._isOnPlatform) {
      const data = localStorage.getItem(this.localPrefix + key);
      return data ? JSON.parse(data) : null;
    }
    try {
      const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`, { credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()).value;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T): Promise<boolean> {
    await this.ensureInit();
    if (!this._isOnPlatform) {
      try {
        localStorage.setItem(this.localPrefix + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    try {
      const res = await fetch('/api/storage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureInit();
    if (!this._isOnPlatform) {
      localStorage.removeItem(this.localPrefix + key);
      return true;
    }
    try {
      const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async keys(prefix?: string): Promise<string[]> {
    await this.ensureInit();
    if (!this._isOnPlatform) {
      const result: string[] = [];
      const searchPrefix = this.localPrefix + (prefix ?? '');
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(searchPrefix)) {
          result.push(k.slice(this.localPrefix.length));
        }
      }
      return result;
    }
    try {
      const url = prefix ? `/api/storage/keys?prefix=${encodeURIComponent(prefix)}` : '/api/storage/keys';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return [];
      return (await res.json()).keys ?? [];
    } catch {
      return []
    }
  }
}

export const storage = new PlatformStorage();
