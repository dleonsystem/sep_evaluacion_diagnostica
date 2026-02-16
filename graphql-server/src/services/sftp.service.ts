import Client from 'ssh2-sftp-client';
import { logger } from '../utils/logger.js';

export class SftpService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client();
    this.client.on('close', () => {
      this.isConnected = false;
      logger.info('SFTP Connection Closed');
    });
    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('SFTP Connection Ended');
    });
    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('SFTP Error', err);
    });
  }

  private getConfig() {
    return {
      host: process.env.SFTP_HOST || 'localhost',
      port: parseInt(process.env.SFTP_PORT || '2222'),
      username: process.env.SFTP_USER || 'user',
      password: process.env.SFTP_PASSWORD || 'pass',
    };
  }

  async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }
    try {
      await this.client.connect(this.getConfig());
      this.isConnected = true;
      logger.info('SFTP Connected');
      return true;
    } catch (err: any) {
      this.isConnected = false;
      logger.error('SFTP Connection Failed', err);
      return false;
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return false;
      }
      await this.client.put(localPath, remotePath);
      logger.info(`File uploaded to SFTP: ${remotePath}`);
      return true;
    } catch (err: any) {
      logger.error('SFTP Upload Failed', { localPath, remotePath, error: err.message });
      // If upload fails, maybe connection dropped.
      this.isConnected = false;
      return false;
    }
  }

  async listFiles(remoteDir: string): Promise<Client.FileInfo[]> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return [];
      }
      const list = await this.client.list(remoteDir);
      return list;
    } catch (err: any) {
      logger.error('SFTP List Failed', { remoteDir, error: err.message });
      this.isConnected = false;
      return [];
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
    }
  }
}
