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

  // 전화번호 인증 가입 (숫자만 저장, 예: 01012345678)
  // 컬럼은 기존 DB 호환을 위해 nullable이지만 신규 가입은 항상 채워짐
  @Column({ unique: true, nullable: true, type: 'varchar' })
  phone: string;

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
