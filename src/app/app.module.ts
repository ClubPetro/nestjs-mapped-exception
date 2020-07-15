import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from './modules/http/http.module';
import { RpcModule } from './modules/rpc/rpc.module';
import ormConfig from './ormconfig';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ormConfig,
    }),
    HttpModule,
    RpcModule,
  ],
})
export class AppModule {}
