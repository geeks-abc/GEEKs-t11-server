import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';
import { Facility } from '../../facilities/entities/facility.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  listingId: number;

  @OneToOne(() => Listing, (listing) => listing.match)
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @Column()
  facilityId: number;

  @ManyToOne(() => Facility)
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  // QR 인수 확인용 1회용 토큰
  @Column({ unique: true })
  qrToken: string;

  @CreateDateColumn()
  matchedAt: Date;
}
