
import { EntityRepository, Repository} from "typeorm";
import { EmailVerificationEntity } from "../entities/email-verification.entity";



@EntityRepository(EmailVerificationEntity)
export class EmailVerificationRepository extends Repository<EmailVerificationEntity> {


}