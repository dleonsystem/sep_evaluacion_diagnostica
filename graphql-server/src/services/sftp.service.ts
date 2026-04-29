import Client from 'ssh2-sftp-client';
import { logger } from '../utils/logger.js';

export class SftpService {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client();
    this.setupListeners();
  }

  private setupListeners() {
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
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASSWORD,
    };
  }

  async connect(): Promise<boolean> {
    if (this.isConnected) {
      try {
        await this.client.list('.');
        return true;
      } catch (e) {
        this.isConnected = false;
      }
    }
    try {
      // Re-instanciar el cliente si hay problemas de estado
      try {
        await this.client.end();
      } catch (e) {
        // Ignored: failure to end an already disconnected or unstable client is expected
      }
      const config = this.getConfig();
      if (!config.username || !config.password) {
        logger.error(
          'SFTP Connection Blocked: Missing SFTP_USER or SFTP_PASSWORD environment variables.'
        );
        return false;
      }

      this.client = new Client();
      this.setupListeners();

      await this.client.connect(config);
      this.isConnected = true;
      const cwd = await this.client.realPath('.');
      logger.info(`SFTP Connected. CWD: ${cwd}`);
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
      // Asegurar que usamos ruta relativa si es necesario
      const cleanPath = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
      await this.client.put(localPath, cleanPath);
      logger.info(`File uploaded to SFTP: ${cleanPath}`);
      return true;
    } catch (err: any) {
      logger.error('SFTP Upload Failed', { localPath, remotePath, error: err.message });
      this.isConnected = false;
      return false;
    }
  }

  async uploadBuffer(buffer: Buffer, remotePath: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return false;
      }
      const cleanPath = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
      await this.client.put(buffer, cleanPath);
      logger.info(`Buffer uploaded to SFTP: ${cleanPath}`);
      return true;
    } catch (err: any) {
      logger.error('SFTP Buffer Upload Failed', {
        remotePath,
        error: err.message,
        stack: err.stack,
      });
      this.isConnected = false;
      return false;
    }
  }

  async ensureDir(remoteDir: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return false;
      }

      // Limpiamos la ruta inicial para evitar problemas con la raíz restringida
      const cleanDir = remoteDir.startsWith('/') ? remoteDir.substring(1) : remoteDir;

      logger.info(`Ensuring SFTP directory: ${cleanDir}`);
      await this.client.mkdir(cleanDir, true);
      logger.info(`SFTP directory ensured: ${cleanDir}`);
      return true;
    } catch (err: any) {
      // Si el error es que ya existe, no lo tratamos como error crítico
      if (err.message && (err.message.includes('already exists') || err.code === 4)) {
        return true;
      }
      logger.error('SFTP Mkdir Failed', { remoteDir, error: err.message });
      return false;
    }
  }

  async listFiles(remoteDir: string): Promise<Client.FileInfo[]> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return [];
      }
      const cleanDir = remoteDir.startsWith('/') ? remoteDir.substring(1) : remoteDir;
      const list = await this.client.list(cleanDir || '.');
      return list;
    } catch (err: any) {
      logger.error('SFTP List Failed', { remoteDir, error: err.message });
      this.isConnected = false;
      return [];
    }
  }

  async downloadBuffer(remotePath: string): Promise<Buffer | null> {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) return null;
      }
      const cleanPath = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
      const buffer = (await this.client.get(cleanPath)) as Buffer;
      return buffer;
    } catch (err: any) {
      logger.error('SFTP Buffer Download Failed', { remotePath, error: err.message });
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.end();
      this.isConnected = false;
    }
  }
}
