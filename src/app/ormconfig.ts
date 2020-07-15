import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST ? process.env.TYPEORM_HOST : '0.0.0.0',
  port: Number(process.env.TYPEORM_PORT)
    ? Number(process.env.TYPEORM_PORT)
    : 5432,
  username: process.env.TYPEORM_USERNAME
    ? process.env.TYPEORM_USERNAME
    : 'postgres',
  password: process.env.TYPEORM_PASSWORD
    ? process.env.TYPEORM_PASSWORD
    : 'postgres',
  database: process.env.TYPEORM_DATABASE
    ? process.env.TYPEORM_DATABASE
    : 'user',
  synchronize: process.env.TYPEORM_SYNCHRONIZE
    ? JSON.parse(process.env.TYPEORM_SYNCHRONIZE)
    : false,
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN
    ? JSON.parse(process.env.TYPEORM_MIGRATIONS_RUN)
    : false,
  logging: process.env.TYPEORM_LOGGING
    ? JSON.parse(process.env.TYPEORM_LOGGING)
    : true,
  entities: [path.join(__dirname, '/**/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  keepConnectionAlive: false,
  cli: {
    migrationsDir: 'src/migrations',
  },
};

export = ormConfig;
