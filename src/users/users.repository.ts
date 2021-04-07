import { LoginDto } from "src/auth/dto/login.dto";
import { RegisterDto } from "src/auth/dto/register.dto";
import { JwtPayload } from "src/auth/interfaces/jwt.interface";
import { EntityRepository, Repository} from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { UserRO } from "./interfaces/user.interface";



@EntityRepository(UserEntity)
export class UsersRepository extends Repository<UserEntity> {

    async validateUser(payload: JwtPayload): Promise<UserRO> {
        return await this.findOne({where: {email: payload.email}});
    }

    async findByEmail(email: string): Promise<boolean> {
        return await this.findOne({where: {email: email}}) ? true : false;
    }

    async register(request: RegisterDto): Promise<UserRO> {
        return await this.save(request);
    }

    async authenticate(email: string) {
        return await this.findOne({where: {email: email}});
    }


}