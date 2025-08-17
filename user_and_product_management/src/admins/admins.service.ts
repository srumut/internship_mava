import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { v4 as uuid4 } from 'uuid';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
    constructor(private readonly db: DatabaseService) {}

    findAll() {
        return this.db.admin.findMany({ omit: { password: true } });
    }

    findById(id: string) {
        return this.db.admin.findUnique({
            where: { id: id },
            omit: { password: true },
        });
    }

    create(dto: CreateAdminDto) {
        const salt = bcrypt.genSaltSync(10);
        return this.db.admin.create({
            data: {
                id: uuid4(),
                password: bcrypt.hashSync(dto.password, salt),
                username: dto.username,
                createdAt: new Date(),
            },
            omit: { password: true },
        });
    }

    delete(id: string) {
        return this.db.admin.delete({
            where: { id: id },
            omit: { password: true },
        });
    }

    update(id: string, dto: UpdateAdminDto) {
        const data = { id: id, ...dto };
        if (data?.password) {
            const salt = bcrypt.genSaltSync(10);
            data.password = bcrypt.hashSync(data.password, salt);
        }
        return this.db.admin.update({
            where: { id: id },
            data: data,
            omit: { password: true },
        });
    }

    findByUsername(username: string) {
        return this.db.admin.findUnique({ where: { username: username } });
    }
}
