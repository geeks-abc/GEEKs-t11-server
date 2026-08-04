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

  // 가게 대표 사진 (온보딩에서 업로드)
  @Column({ nullable: true, type: 'varchar' })
  photoUrl: string | null;

  @OneToMany(() => Listing, (listing) => listing.store)
  listings: Listing[];
}
