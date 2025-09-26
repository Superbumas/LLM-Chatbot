import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';

class AuthService {
  constructor() {
    this.authClient = null;
    this.agent = null;
    this.identity = null;
  }

  async initialize() {
    this.authClient = await AuthClient.create();
    const isAuthenticated = await this.authClient.isAuthenticated();
    
    if (isAuthenticated) {
      this.identity = this.authClient.getIdentity();
      await this.createAgent();
    }
    
    return isAuthenticated;
  }

  async createAgent() {
    const canisterId = process.env.CANISTER_ID_BACKEND;
    this.agent = new HttpAgent({
      identity: this.identity,
      host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
    });

    if (process.env.DFX_NETWORK !== 'ic') {
      await this.agent.fetchRootKey();
    }
  }

  async login() {
    const days = BigInt(1);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);
    
    const APPLICATION_NAME = 'LLM Chatbot';
    const APPLICATION_LOGO_URL = '/favicon.ico';
    
    await this.authClient?.login({
      identityProvider: process.env.DFX_NETWORK === 'ic' 
        ? 'https://identity.ic0.app'
        : `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`,
      maxTimeToLive: days * hours * nanoseconds,
      applicationName: APPLICATION_NAME,
      applicationLogo: APPLICATION_LOGO_URL,
      onSuccess: async () => {
        this.identity = this.authClient.getIdentity();
        await this.createAgent();
      },
    });
  }

  async logout() {
    await this.authClient?.logout();
    this.identity = null;
    this.agent = null;
  }

  getIdentity() {
    return this.identity;
  }

  getPrincipal() {
    return this.identity?.getPrincipal();
  }

  isAuthenticated() {
    return this.authClient?.isAuthenticated() ?? false;
  }
}

export const authService = new AuthService();