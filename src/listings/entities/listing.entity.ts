import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ListingStatus } from '../../common/enums';
import { Store } from '../../stores/entities/store.entity';
import { Match } from '../../matches/entities/match.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  storeId: number;

  @ManyToOne(() => Store, (store) => store.listings)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column()
  itemName: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  photoUrl: string;

  @Column('datetime')
  pickupStart: Date;

  @Column('datetime')
  pickupEnd: Date;

  @Column({ type: 'enum', enum: ListingStatus, default: ListingStatus.OPEN })
  status: ListingStatus;

  @OneToOne(() => Match, (match) => match.listing)
  match: Match;

  @CreateDateColumn()
  createdAt: Date;
}
