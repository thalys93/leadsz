import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from 'src/company/entities/company.entity';
import { User } from 'src/user/entities/user.entity';
import { Lead } from 'src/lead/entities/lead.entity';
import { ChannelType } from 'src/enums/ChannelType';
import { TemplatePurpose } from 'src/enums/TemplatePurpose';

@Entity()
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId: string | null;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'enum', enum: ChannelType })
  channel: ChannelType;

  @Column({ type: 'enum', enum: TemplatePurpose })
  purpose: TemplatePurpose;

  @Column({ type: 'text', nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'ai_generated', type: 'boolean', default: false })
  aiGenerated: boolean;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
