import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { ListingsModule } from './listings/listings.module';
import { MatchesModule } from './matches/matches.module';
import { DonationsModule } from './donations/donations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'geeks'),
        autoLoadEntities: true,
        synchronize: true, // 해커톤 MVP용 — 프로덕션에서는 마이그레이션 사용
        timezone: '+09:00',
      }),
    }),
    AuthModule,
    StoresModule,
    FacilitiesModule,
    ListingsModule,
    MatchesModule,
    DonationsModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
