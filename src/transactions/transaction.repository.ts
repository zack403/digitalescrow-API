import { UserEntity } from "src/users/entities/user.entity";
import { EntityRepository, Repository } from "typeorm";
import { TransactionEntity } from "./entities/transaction.entity";




@EntityRepository(TransactionEntity)
export class TransactionRepository extends Repository<TransactionEntity> {

}