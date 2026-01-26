import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.uri');
        
        return {
          uri,
          // Connection pool settings
          maxPoolSize: 10, // Maintain up to 10 socket connections
          serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          
          // Connection timeout settings
          connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
          
          // Retry settings
          retryWrites: true,
          retryReads: true,
          
          // Additional MongoDB driver options
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
          heartbeatFrequencyMS: 10000, // Check server status every 10 seconds
          
          // Mongoose-specific options
          bufferCommands: false, // Disable mongoose buffering
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}