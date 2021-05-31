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
            url: configService.get('DATABASE_URL'),
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
