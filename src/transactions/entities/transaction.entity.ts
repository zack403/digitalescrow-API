import { TransactionStatus, TransactionType } from "src/enum/enum";
import { UserEntity } from "src/users/entities/user.entity";
import { AbstractBaseEntity } from "src/_common/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { CounterPartyInfo } from "../interfaces/counter-party-info.interface";
import { EscrowBankDetails } from "../interfaces/escrow-bank-details.interface";


@Entity('Transaction')
export class TransactionEntity extends AbstractBaseEntity {

    @Column({type: "varchar", length: 128})
    commodityName: string;
    
    @Column({type: "enum", enum: TransactionType})
    type: TransactionType;

    @Column({type: "varchar", nullable: true, length: 128})
    description: string;

    @Column({type: "varchar", nullable: true, length: 128})
    otherMessage: string;

    @Column({ type: "int"})
    amount: number;

    @Column('uuid')
    userId: string;

    @Column({ name: 'paymentDate', default: new Date()})
    paymentDate: Date;

    @Column({type: "varchar", default: TransactionStatus.PENDING})
    status: TransactionStatus;

    @Column({ name: 'expiryDate', default: new Date()})
    expiryDate: Date;
    // @Column("simple-array", {nullable: true})
    // images: string[];
    @Column({type: "varchar", nullable: true, length: 128})
    rejectionReason: string;

    @Column("simple-array", {nullable: true})
    conditions: string[];

    @Column({type: 'bool', default: false })
    hasChanges: boolean;

    @Column("simple-json")
    counterPartyInfo: CounterPartyInfo;

    @Column("simple-json", {nullable: true})
    escrowBankDetails: EscrowBankDetails;

    @ManyToOne(() => UserEntity, u => u.transactions)
    user: UserEntity;
}
