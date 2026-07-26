import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from 'src/lead/entities/lead.entity';
import { User } from 'src/user/entities/user.entity';
import { TimelineEventType } from 'src/enums/TimelineEventType';

@Entity()
export class TimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'enum', enum: TimelineEventType })
  type: TimelineEventType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
