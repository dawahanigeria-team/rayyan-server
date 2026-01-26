import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let connection: Connection;

  beforeEach(async () => {
    const mockConnection = {
      readyState: 1, // connected
      host: 'localhost',
      port: 27017,
      name: 'test',
      on: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    connection = module.get<Connection>(getConnectionToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return connected state', () => {
    expect(service.getConnectionState()).toBe('connected');
  });

  it('should return true for isConnected when readyState is 1', () => {
    expect(service.isConnected()).toBe(true);
  });

  it('should return connection stats', () => {
    const stats = service.getConnectionStats();
    expect(stats).toEqual({
      state: 'connected',
      host: 'localhost',
      port: 27017,
      name: 'test',
      readyState: 1,
    });
  });
});