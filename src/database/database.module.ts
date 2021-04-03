import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('POSTGRES_HOST'),
            port: configService.get('POSTGRES_PORT'),
            username: configService.get('POSTGRES_USER'),
            password: configService.get('POSTGRES_PASSWORD'),
            database: configService.get('POSTGRES_DB'),
            entities: [
              __dirname + '/../**/*.entity.ts',
              __dirname + '/../**/*.entity.js',
            ],
            synchronize: true,
            migrations: ["dist/database/migrations/*{.ts,.js}"],
            migrationsTableName: "migrations_typeorm",
            migrationsRun: true,
            cli: {
                migrationsDir: "src/database/migrations"
            }
          })
        }),
      ],
})
export class DatabaseModule {}
