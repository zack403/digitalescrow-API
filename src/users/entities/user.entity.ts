import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { AbstractBaseEntity } from 'src/_common/base.entity';
import { IsEmail } from 'class-validator';
import { TransactionEntity } from 'src/transactions/entities/transaction.entity';
import { PaymentEntity } from 'src/payments/entities/payment.entity';
import { UserBankDetails } from '../dto/user-bank-details.dto';

@Entity('User')
export class UserEntity extends AbstractBaseEntity {
  
  @IsEmail()
  @Column({ unique: true, length: 128 })
  email: string;

  @Column({type: "varchar", length: 128})
  name: string;

  @Column("simple-json", {nullable: true})
  userBankDetails: UserBankDetails;

  @Column({type: "varchar", nullable: true, length: 128})
  address: string;

  @Column({type: "varchar", nullable: true, length: 128})
  gender: string;

  @Column({type: "varchar", nullable: true})
  profileImage: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({type: "varchar", nullable: true, length: 128})
  phoneNumber: string;
  
  @Column()
  @Exclude()
  password: string;

  @Column()
  @Exclude()
  confirmPassword: string;

  @Column({type: "varchar", nullable: true})
  @Exclude()
  currentHashedRefreshToken?: string;
  
  @Column({type: 'bool', default: false })
  emailVerified: boolean;

  @Column({type: 'bool', default: false })
  isAdmin: boolean;

  @OneToMany(() => TransactionEntity, t => t.user)
  transactions: TransactionEntity[];

  @OneToMany(() => PaymentEntity, t => t.user)
  payments: PaymentEntity[];
}

