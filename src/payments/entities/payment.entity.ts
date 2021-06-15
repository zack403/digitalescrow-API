import { PaymentStatus, TransactionStatus, TransactionType } from "src/enum/enum";
import { UserEntity } from "src/users/entities/user.entity";
import { AbstractBaseEntity } from "src/_common/base.entity";
import { Column, Entity, ManyToOne } from "typeorm";


@Entity('Payment')
export class PaymentEntity extends AbstractBaseEntity {

    @Column({ type: "int"})
    amountRecieved: number;

    @Column({ type: "int"})
    amountSent: number;

    @Column('uuid')
    userId: string;

    @Column({type: 'varchar'})
    virtualAccountNumber:  string;

    @Column({type: 'varchar'})
    transactionId:  string;

    @Column({ name: 'paymentDate', default: new Date()})
    paymentDate: Date;

    @Column({type: 'varchar', default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @ManyToOne(() => UserEntity, u => u.payments)
    user: UserEntity;
    
}
