import { LoginDto } from "src/auth/dto/login.dto";
import { RegisterDto } from "src/auth/dto/register.dto";
import { JwtPayload } from "src/auth/interfaces/jwt.interface";
import { Filter } from "src/_utility/filter.util";
import { Brackets, EntityRepository, Repository} from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { UserRO } from "./interfaces/user.interface";



@EntityRepository(UserEntity)
export class UsersRepository extends Repository<UserEntity> {

    async findAll({search, page} : Filter): Promise<UserRO[]> {
        if(search) {
            const users = await this.createQueryBuilder("user")
                    .innerJoinAndSelect("user.transactions", "transactions")
                    .innerJoinAndSelect("user.payments", "payments")
                    .where(new Brackets(qb => {
                        qb.where("user.name ILike :name", { name: `%${search}%` })
                        .orWhere("user.email ILike :email", { email: `%${search}%` })
                    }))
                    .orderBy("user.createdAt", "DESC")
                    .skip(15 * (page ? page - 1 : 0))
                    .take(15)
                    .getMany();

            return users;
            
        }

        return await this.find({ order: {createdAt: 'DESC'}, relations: ['transactions', 'payments'], take: 15, skip: page ? 15 * (page - 1) : 0});

    }

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