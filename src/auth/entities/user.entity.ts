import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  // 역할에 따라 연결되는 프로필 (STORE → storeId, FACILITY → facilityId)
  @Column({ nullable: true })
  storeId: number;

  @Column({ nullable: true })
  facilityId: number;

  @CreateDateColumn()
  createdAt: Date;
}
