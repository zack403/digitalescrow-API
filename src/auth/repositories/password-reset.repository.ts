
import { EntityRepository, Repository} from "typeorm";
import { PasswordResetEntity } from "../entities/password-reset.entity";


@EntityRepository(PasswordResetEntity)
export class PasswordResetRepository extends Repository<PasswordResetEntity> {


}