import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 푸드뱅크 | 지역아동센터 | 무료급식소
  @Column()
  type: string;

  @Column()
  address: string;

  @Column('double')
  lat: number;

  @Column('double')
  lng: number;

  @Column({ nullable: true })
  phone: string;
}
