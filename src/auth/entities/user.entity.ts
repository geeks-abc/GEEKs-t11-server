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

  // 이메일 로그인 계정용 (전화번호 가입 시 null)
  @Column({ unique: true, nullable: true, type: 'varchar' })
  email: string | null;

  @Column({ select: false, nullable: true, type: 'varchar' })
  password: string | null;

  // 전화번호 가입 계정용 (숫자만 저장, 예: 01012345678)
  @Column({ unique: true, nullable: true, type: 'varchar' })
  phone: string | null;

  @Column({ nullable: true, type: 'varchar' })
  nickname: string | null;

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
