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
import { Company } from 'src/company/entities/company.entity';

@Entity()
@Unique(['companyId', 'name'])
@Unique(['companyId', 'translateKey'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'translate_key', type: 'text', nullable: true })
  translateKey: string | null;

  @Column({ type: 'text', nullable: true })
  icon: string | null;

  @Column({
    name: 'min_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  minPrice: string | null;

  @Column({
    name: 'ideal_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  idealPrice: string | null;

  @Column({
    name: 'max_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maxPrice: string | null;

  @Column({ name: 'scope_in', type: 'text', nullable: true })
  scopeIn: string | null;

  @Column({ name: 'scope_out', type: 'text', nullable: true })
  scopeOut: string | null;

  @Column({ name: 'typical_deadline', type: 'text', nullable: true })
  typicalDeadline: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
