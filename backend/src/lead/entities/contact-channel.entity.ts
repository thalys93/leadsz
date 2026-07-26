import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { ChannelType } from 'src/enums/ChannelType';

@Entity()
@Unique(['leadId', 'type'])
export class ContactChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId: string;

  @ManyToOne(() => Lead, (lead) => lead.channels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'enum', enum: ChannelType })
  type: ChannelType;

  @Column({ type: 'text' })
  value: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
