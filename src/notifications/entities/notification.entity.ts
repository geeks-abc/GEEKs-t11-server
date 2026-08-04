import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RecipientType } from '../../common/enums';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: RecipientType })
  recipientType: RecipientType;

  @Column()
  recipientId: number;

  // MATCHED | NEW_LISTING | COMPLETED
  @Column()
  type: string;

  @Column('json')
  payload: Record<string, unknown>;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
