import { Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

export abstract class AbstractBaseEntity extends BaseEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    createdBy: string

    @Column({nullable: true })
    updatedBy: string

    @CreateDateColumn({ name: 'createdAt', default: new Date() })
    createdAt: Date

    @UpdateDateColumn({ name: 'updatedAt', nullable: true })
    updatedAt: Date

}