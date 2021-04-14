import { TransactionType } from "src/enum/enum";
import { UserEntity } from "src/users/entities/user.entity";
import { AbstractBaseEntity } from "src/_common/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { SellerInfo } from "../interfaces/seller-info.interface";


@Entity('Transaction')
export class TransactionEntity extends AbstractBaseEntity {

    @Column({type: "varchar", length: 128})
    name: string;
    
    @Column({type: "enum", enum: TransactionType})
    type: TransactionType;

    @Column({type: "varchar", nullable: true, length: 128})
    description: string;

    @Column({ type: "int"})
    amount: number;

    @Column({ name: 'paymentDate', default: new Date()})
    paymentDate: Date;

    @Column({ name: 'expiryDate', default: new Date()})
    expiryDate: Date;

    @Column("simple-array", {nullable: true})
    images: string[];

    @Column("simple-array", {nullable: true})
    conditions: string[];

    @Column("simple-json")
    sellerInfo: SellerInfo;

    @ManyToOne(() => UserEntity, u => u.transactions)
    user: UserEntity;
}
