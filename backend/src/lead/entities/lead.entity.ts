import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from 'src/company/entities/company.entity';
import { User } from 'src/user/entities/user.entity';
import { ChannelType } from 'src/enums/ChannelType';
import { LeadStage } from 'src/enums/LeadStage';
import { ContactChannel } from './contact-channel.entity';
import { LeadCheckpoints } from '../lead-score';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: User | null;

  @Column({ name: 'contact_name', type: 'text' })
  contactName: string;

  @Column({ name: 'company_name', type: 'text', nullable: true })
  companyName: string | null;

  @Column({
    name: 'primary_channel',
    type: 'enum',
    enum: ChannelType,
  })
  primaryChannel: ChannelType;

  @Column({ type: 'text' })
  service: string;

  @Column({
    name: 'deal_value',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  dealValue: string | null;

  @Column({ type: 'enum', enum: LeadStage, default: LeadStage.LEAD })
  stage: LeadStage;

  @Column({ name: 'next_action', type: 'text', nullable: true })
  nextAction: string | null;

  @Column({ name: 'next_action_at', type: 'date', nullable: true })
  nextActionAt: string | null;

  @Column({ type: 'jsonb', default: {} })
  checkpoints: LeadCheckpoints;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => ContactChannel, (channel) => channel.lead, {
    cascade: true,
  })
  channels: ContactChannel[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
