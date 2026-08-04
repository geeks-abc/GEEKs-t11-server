import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column('double')
  lat: number;

  @Column('double')
  lng: number;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Listing, (listing) => listing.store)
  listings: Listing[];
}
