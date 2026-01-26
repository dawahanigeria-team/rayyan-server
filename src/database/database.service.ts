import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    this.setupConnectionEventHandlers();
    this.logger.log('Database service initialized');
  }

  private setupConnectionEventHandlers(): void {
    this.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
    });

    this.connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
    });

    this.connection.on('close', () => {
      this.logger.warn('MongoDB connection closed');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.gracefulShutdown();
    });

    process.on('SIGTERM', async () => {
      await this.gracefulShutdown();
    });
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      this.logger.log('Closing MongoDB connection...');
      await this.connection.close();
      this.logger.log('MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during MongoDB connection shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[this.connection.readyState] || 'unknown';
  }

  /**
   * Check if the database is connected
   */
  isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  /**
   * Get database connection statistics
   */
  getConnectionStats() {
    return {
      state: this.getConnectionState(),
      host: this.connection.host,
      port: this.connection.port,
      name: this.connection.name,
      readyState: this.connection.readyState,
    };
  }
}