import { AuthClient } from '@dfinity/auth-client';
import { HttpAgent } from '@dfinity/agent';
import { backend as defaultBackendActor, canisterId as backendCanisterId, createActor as createBackendActor } from 'declarations/backend';

class AuthService {
  constructor() {
    this.authClient = null;
    this.agent = null;
    this.identity = null;
    this.actor = defaultBackendActor;
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
    const host = process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943';
    this.agent = new HttpAgent({
      identity: this.identity,
      host,
    });

    if (process.env.DFX_NETWORK !== 'ic') {
      await this.agent.fetchRootKey();
    }

    this.actor = createBackendActor(backendCanisterId, {
      agent: this.agent,
    });
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
    this.actor = defaultBackendActor;
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

  getBackendActor() {
    return this.actor ?? defaultBackendActor;
  }
}

export const authService = new AuthService();
