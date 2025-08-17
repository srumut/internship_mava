import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CompaniesService } from 'src/companies/companies.service';

@Injectable()
export class ProductsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly companiesService: CompaniesService,
    ) {}

    private add_qury_string(whole_query_string: string, query_string: string) {
        if (whole_query_string === '') {
            whole_query_string += `WHERE ${query_string}`;
            return whole_query_string;
        }
        whole_query_string += ` AND ${query_string}`;
        return whole_query_string;
    }

    findAll(query: {}) {
        let query_string: string = '';
        if (query['branch_id']) {
            query_string = this.add_qury_string(
                query_string,
                `b.id = '${query['branch_id']}'`,
            );
        }
        if (query['company_id']) {
            query_string = this.add_qury_string(
                query_string,
                `c.id = '${query['company_id']}'`,
            );
        }
        if (query['category_id']) {
            query_string = this.add_qury_string(
                query_string,
                `ct.id = '${query['category_id']}'`,
            );
        }
        if (query['min_stock']) {
            const min_stock = parseInt(query['min_stock'], 10);
            if (Number.isNaN(min_stock) || min_stock < 0) {
                throw new BadRequestException(
                    'min_stock must be a non negative numeric string',
                );
            }
            query_string = this.add_qury_string(
                query_string,
                `p.stock >= ${min_stock}`,
            );
        }
        if (query['max_stock']) {
            const max_stock = parseInt(query['max_stock'], 10);
            if (Number.isNaN(max_stock) || max_stock < 0) {
                throw new BadRequestException(
                    'max_stock must be a non negative numeric string',
                );
            }
            query_string = this.add_qury_string(
                query_string,
                `p.stock <= ${max_stock}`,
            );
        }
        // TODO(umut): this probably leaves possibility to sql injection, so fix it
        return this.db.$queryRawUnsafe(`
            SELECT
                p.id AS id,
                p.name AS name,
                p.stock AS stock,
                ct.id AS category_id,
                ct.name AS category,
                ct.description AS category_description,
                b.id AS branch_id,
                b.name AS branch,
                c.id AS company_id,
                c.name AS company
            FROM product p
            INNER JOIN branch b ON b.id = p.branch_id
            INNER JOIN company c ON c.id = b.company_id
            INNER JOIN category ct ON ct.id = p.category_id
            ${query_string};`);
    }

    findById(id: string) {
        return this.db.$queryRaw`
            SELECT
                p.id AS id,
                p.name AS name,
                p.stock AS stock,
                ct.id AS category_id,
                ct.name AS category,
                ct.description AS category_description,
                b.id AS branch_id,
                b.name AS branch,
                c.id AS company_id,
                c.name AS company
            FROM product p
            INNER JOIN branch b ON b.id = p.branch_id
            INNER JOIN company c ON c.id = b.company_id
            INNER JOIN category ct ON ct.id = p.category_id
            WHERE p.id = ${id};`;
    }

    async create(dto: CreateProductDto) {
        const branch = await this.companiesService.findBranchById(
            dto.branch_id,
        );
        if (!branch) {
            throw new NotFoundException(
                `Branch with the id '${dto.branch_id}' was not found`,
            );
        }
        const branchCategory = await this.db.branchCategories.findUnique({
            where: {
                category_id_branch_id: {
                    branch_id: dto.branch_id,
                    category_id: dto.category_id,
                },
            },
        });
        if (!branchCategory) {
            throw new BadRequestException(
                `Branch with the id '${dto.branch_id}' does not have categroy with the id '${dto.category_id}'`,
            );
        }
        await this.db.product.create({
            data: {
                ...dto,
                createdAt: new Date(),
            },
        });
        return this.findById(dto.id);
    }

    async delete(id: string) {
        const product = await this.db.product.delete({ where: { id: id } });
        const extra_info: {}[] = await this.db.$queryRaw`
            SELECT
                ct.name AS category,
                ct.description AS category_description,
                b.name AS branch,
                c.id AS company_id,
                c.name AS company
            FROM branch b
            INNER JOIN company c ON c.id = b.company_id
            INNER JOIN category ct ON ct.id = ${product.category_id}
            WHERE b.id = ${product.branch_id};`;
        const data = { ...extra_info[0] };
        data['id'] = product.id;
        data['name'] = product.name;
        data['stock'] = product.stock;
        data['branch_id'] = product.branch_id;
        data['category_id'] = product.category_id;
        return data;
    }

    async update(id: string, dto: UpdateProductDto) {
        const product = await this.db.product.update({
            where: { id: id },
            data: { ...dto },
        });
        const extra_info: {}[] = await this.db.$queryRaw`
            SELECT
                ct.name AS category,
                ct.description AS category_description,
                b.name AS branch,
                c.id AS company_id,
                c.name AS company
            FROM branch b
            INNER JOIN company c ON c.id = b.company_id
            INNER JOIN category ct ON ct.id = ${product.category_id}
            WHERE b.id = ${product.branch_id};`;
        const data = { ...extra_info[0] };
        data['id'] = product.id;
        data['name'] = product.name;
        data['stock'] = product.stock;
        data['branch_id'] = product.branch_id;
        data['category_id'] = product.category_id;
        return data;
    }
}
