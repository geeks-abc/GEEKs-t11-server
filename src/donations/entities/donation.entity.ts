import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  matchId: number;

  @OneToOne(() => Match)
  @JoinColumn({ name: 'matchId' })
  match: Match;

  @Column('datetime')
  completedAt: Date;

  @Column('double')
  weightKg: number;

  @Column({ nullable: true })
  certificateUrl: string;
}
