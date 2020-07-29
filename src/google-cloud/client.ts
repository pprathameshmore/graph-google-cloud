import { IntegrationConfig } from '../types';
import { google } from 'googleapis';
import {
  JWT,
  Compute,
  UserRefreshClient,
  CredentialBody,
} from 'google-auth-library';
import { GaxiosResponse } from 'gaxios';

export interface ClientOptions {
  config: IntegrationConfig;
}

export interface PageableResponse {
  nextPageToken?: string;
}

export type PageableGaxiosResponse<T> = GaxiosResponse<
  T & {
    nextPageToken?: string | null | undefined;
  }
>;

export type GoogleClientAuth = JWT | Compute | UserRefreshClient;

export class Client {
  readonly projectId: string;

  private credentials: CredentialBody;
  private auth: GoogleClientAuth;

  constructor({ config }: ClientOptions) {
    this.projectId = config.projectId;

    this.credentials = {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    };
  }

  private async getClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: this.credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    await client.getAccessToken();
    return client;
  }

  async getAuthenticatedServiceClient(): Promise<GoogleClientAuth> {
    if (!this.auth) {
      this.auth = await this.getClient();
    }

    return this.auth;
  }

  async iterateApi<T>(
    fn: (nextPageToken?: string) => Promise<PageableGaxiosResponse<T>>,
    callback: (data: T) => Promise<void>,
  ) {
    let nextPageToken: string | undefined;

    do {
      const result = await fn(nextPageToken);
      nextPageToken = result.data.nextPageToken || undefined;
      await callback(result.data);
    } while (nextPageToken);
  }
}