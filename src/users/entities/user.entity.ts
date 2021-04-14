import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { AbstractBaseEntity } from 'src/_common/base.entity';
import { IsEmail } from 'class-validator';
import { TransactionEntity } from 'src/transactions/entities/transaction.entity';

@Entity('User')
export class UserEntity extends AbstractBaseEntity {
  
  @IsEmail()
  @Column({ unique: true, length: 128 })
  public email: string;

  @Column({type: "varchar", length: 128})
  public name: string;

  @Column({ type: 'varchar', unique: true })
  public accountNumber: string;

  @Column({type: "varchar", nullable: true, length: 128})
  public address: string;

  @Column({type: "varchar", nullable: true, length: 128})
  public gender: string;

  @Column({type: "varchar", nullable: true})
  public profileImage: string;

  @Column({ type: 'date', nullable: true })
  public dateOfBirth: Date;

  @Column({type: "varchar", length: 128})
  public phoneNumber: string;
  
  @Column()
  @Exclude()
  public password: string;

  @Column()
  @Exclude()
  public confirmPassword: string;

  @Column({type: "varchar", nullable: true})
  public avatar: string;

  @Column({type: "varchar", nullable: true})
  @Exclude()
  public currentHashedRefreshToken?: string;
  
  @Column({type: 'bool', default: false })
  public emailVerified: boolean;

  @Column({type: 'bool', default: false })
  public isAdmin: boolean;

  @OneToMany(() => TransactionEntity, t => t.user)
  transactions: TransactionEntity[];
}

