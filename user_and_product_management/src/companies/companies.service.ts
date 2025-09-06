import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { v4 as uuid4 } from 'uuid';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class CompaniesService {
    constructor(private readonly db: DatabaseService) {}

    findAll() {
        return this.db.company.findMany();
    }

    findById(id: string) {
        return this.db.company.findUnique({ where: { id } });
    }

    create(dto: CreateCompanyDto) {
        return this.db.company.create({
            data: {
                id: uuid4(),
                name: dto.name,
                createdAt: new Date(),
            },
        });
    }

    delete(id: string) {
        return this.db.company.delete({
            where: { id },
        });
    }

    update(id: string, dto: UpdateCompanyDto) {
        return this.db.company.update({ where: { id }, data: { ...dto } });
    }

    findAllBranches() {
        return this.db.branch.findMany();
    }

    findBranchById(id: string) {
        return this.db.branch.findUnique({ where: { id } });
    }

    createBranch(dto: CreateBranchDto) {
        return this.db.branch.create({ data: { id: uuid4(), ...dto } });
    }

    deleteBranch(id: string) {
        return this.db.branch.delete({ where: { id } });
    }

    updateBranch(id: string, dto: UpdateBranchDto) {
        return this.db.branch.update({ where: { id }, data: { ...dto } });
    }

    findCategoriesForTheGivenBranch(id: string) {
        return this.db.$queryRaw`
            SELECT
                ct.id AS id,
                ct.name AS name,
                ct.description AS description
            FROM branch b
            INNER JOIN branch_categories bct ON bct.branch_id = b.id
            INNER JOIN category ct ON ct.id = bct.category_id
            WHERE b.id = ${id}`;
    }

    async addGivenCategoryToTheGivenBranch(
        branch_id: string,
        category_id: string,
    ) {
        await this.db.branchCategories.create({
            data: { branch_id, category_id },
        });

        return this.db.category.findUnique({
            where: { id: category_id },
        });
    }

    removeGivenCategoryFromTheGivenBranch(
        branch_id: string,
        category_id: string,
    ) {
        return this.db.branchCategories.delete({
            where: { category_id_branch_id: { branch_id, category_id } },
        });
    }
}
