import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), NotificationsModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
