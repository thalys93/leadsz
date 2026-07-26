import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { hashSync } from 'bcrypt';
import { Role } from 'src/roles/entities/role.entity';
import { Company } from 'src/company/entities/company.entity';
import { CompanyRole } from 'src/enums/CompanyRole';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: false, type: 'text', unique: true })
  @Unique(['email'])
  email: string;

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  password: string;

  @Column({ nullable: true, type: 'text' })
  @Exclude()
  recoverToken: string;

  @Column({ nullable: true, type: 'text' })
  avatar_url: string;

  @Column({ name: 'job_title', nullable: true, type: 'text' })
  jobTitle: string | null;

  @Column({ nullable: true, type: 'text' })
  phone: string | null;

  @Column({ nullable: true, type: 'text' })
  website: string | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => Company, (company) => company.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({
    name: 'company_role',
    type: 'enum',
    enum: CompanyRole,
    nullable: true,
  })
  companyRole: CompanyRole | null;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  hashPasswordOnInsert() {
    if (this.password) {
      this.password = hashSync(this.password, 10);
    }
  }

  @Column({ nullable: true, type: 'json', default: {} })
  settings: Record<string, unknown>;
}
