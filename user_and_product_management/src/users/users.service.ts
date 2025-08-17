import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuid4 } from 'uuid';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { OrderProductDto } from './dto/order.dto';
import { Order, UserOrder } from './types';

@Injectable()
export class UsersService {
    constructor(private readonly db: DatabaseService) {}

    findAll() {
        return this.db.user.findMany({
            omit: { password: true },
        });
    }

    findById(id: string) {
        return this.db.user.findUnique({
            where: { id: id },
            omit: { password: true },
        });
    }

    create(dto: CreateUserDto) {
        const salt = bcrypt.genSaltSync(10);
        return this.db.user.create({
            data: {
                ...dto,
                id: uuid4(),
                password: bcrypt.hashSync(dto.password, salt),
                createdAt: new Date(),
            },
            omit: { password: true },
        });
    }

    delete(id: string) {
        return this.db.user.delete({
            where: { id: id },
            omit: { password: true },
        });
    }

    update(id: string, dto: UpdateUserDto) {
        const data = { id, ...dto };
        if (data?.password) {
            const salt = bcrypt.genSaltSync(10);
            data.password = bcrypt.hashSync(data.password, salt);
        }
        return this.db.user.update({
            where: { id: id },
            data: data,
            omit: { password: true },
        });
    }

    findByUsername(
        username: string,
        select?: {
            id?: true;
            username?: true;
            password?: true;
            name?: true;
            surname?: true;
            createdAt?: true;
            updatedAt?: true;
        },
    ) {
        return this.db.user.findUnique({
            where: { username: username },
            select,
        });
    }

    async findAllOrders() {
        const db_orders: [
            {
                user_id: string;
                order_id: string;
                username: string;
                name: string;
                surname: string;
                product: string;
                product_id: string;
                category_id: string;
                category: string;
                category_description: string;
                branch: string;
                branch_id: string;
                company: string;
                company_id: string;
                count: number;
                time: Date;
            },
        ] = await this.db.$queryRaw`SELECT 
            o.user_id AS user_id,
            o.id AS order_id,
            u.username AS username,
            u.name AS name,
            u.surname AS surname,
            p.name AS product, 
            p.id AS product_id,
            b.name AS branch,
            b.id AS branch_id,
            c.name AS company,
            c.id AS company_id,
            ct.name AS category,
            ct.id AS category_id,
            ct.description AS category_description,
            op.count AS count,
            o.createdAt AS 'time'
            FROM "order" o
        INNER JOIN order_products op ON o.id = op.order_id
        INNER JOIN product p ON op.product_id = p.id
        INNER JOIN branch b ON p.branch_id = b.id
        INNER JOIN user u ON o.user_id = u.id
        INNER JOIN company c ON b.company_id = c.id
        INNER JOIN category ct ON p.category_id = ct.id`;

        const users: UserOrder[] = [];
        let order_added: boolean;
        for (let db_order of db_orders) {
            order_added = false;
            for (let user of users) {
                if (user.user_id !== db_order.user_id) continue;
                for (let user_order of user.orders) {
                    if (user_order.order_id !== db_order.order_id) {
                        continue;
                    }
                    user_order.products.push({
                        product_id: db_order.product_id,
                        product: db_order.product,
                        category: db_order.category,
                        category_id: db_order.category_id,
                        category_description: db_order.category_description,
                        branch: db_order.branch,
                        branch_id: db_order.branch_id,
                        count: db_order.count,
                        company: db_order.company,
                        company_id: db_order.company_id,
                    });
                    order_added = true;
                    break;
                }
                if (order_added) break;
                // if order is not yet added to users order list
                user.orders.push({
                    order_id: db_order.order_id,
                    products: [
                        {
                            product_id: db_order.product_id,
                            product: db_order.product,
                            category: db_order.category,
                            category_id: db_order.category_id,
                            category_description: db_order.category_description,
                            branch: db_order.branch,
                            branch_id: db_order.branch_id,
                            count: db_order.count,
                            company: db_order.company,
                            company_id: db_order.company_id,
                        },
                    ],
                });
                order_added = true;
                break;
            }
            if (order_added) continue;
            // if user is not yet added to response
            users.push({
                user_id: db_order.user_id,
                username: db_order.username,
                name: db_order.name,
                surname: db_order.surname,
                orders: [
                    {
                        order_id: db_order.order_id,
                        products: [
                            {
                                product_id: db_order.product_id,
                                product: db_order.product,
                                category: db_order.category,
                                category_id: db_order.category_id,
                                category_description:
                                    db_order.category_description,
                                branch: db_order.branch,
                                branch_id: db_order.branch_id,
                                count: db_order.count,
                                company: db_order.company,
                                company_id: db_order.company_id,
                            },
                        ],
                    },
                ],
            });
        }

        return users;
    }

    async findAllOrdersByUser(username: string) {
        const orders: [
            {
                order_id: string;
                product: string;
                product_id: string;
                category_id: string;
                category: string;
                category_description: string;
                branch: string;
                branch_id: string;
                company: string;
                company_id: string;
                count: number;
                time: Date;
            },
        ] = await this.db.$queryRaw`SELECT 
            o.user_id AS user_id,
            o.id AS order_id,
            u.username AS username,
            p.name AS product, 
            p.id AS product_id,
            b.name AS branch,
            b.id AS branch_id,
            c.name AS company,
            c.id AS company_id,
            ct.name AS category,
            ct.id AS category_id,
            ct.description AS category_description,
            op.count AS count,
            o.createdAt AS 'time'
            FROM "order" o
        INNER JOIN order_products op ON o.id = op.order_id
        INNER JOIN product p ON op.product_id = p.id
        INNER JOIN branch b ON p.branch_id = b.id
        INNER JOIN user u ON o.user_id = u.id
        INNER JOIN company c ON b.company_id = c.id
        INNER JOIN category ct ON p.category_id = ct.id
        WHERE u.username = ${username}`;

        const response: Order[] = [];
        let order_added: boolean;
        for (let order of orders) {
            order_added = false;
            for (let r of response) {
                if (r.order_id !== order.order_id) continue;
                r.products.push({
                    product_id: order.product_id,
                    product: order.product,
                    category: order.category,
                    category_id: order.category_id,
                    category_description: order.category_description,
                    branch: order.branch,
                    branch_id: order.branch_id,
                    count: order.count,
                    company: order.company,
                    company_id: order.company_id,
                });
                order_added = true;
                break;
            }
            if (order_added) continue;
            // if order is not yet added to users order list
            response.push({
                order_id: order.order_id,
                products: [
                    {
                        product_id: order.product_id,
                        product: order.product,
                        category: order.category,
                        category_id: order.category_id,
                        category_description: order.category_description,
                        branch: order.branch,
                        branch_id: order.branch_id,
                        count: order.count,
                        company: order.company,
                        company_id: order.company_id,
                    },
                ],
            });
            order_added = true;
        }

        return response;
    }

    private async getOrder(user_id: string, order_id: string) {
        return this.db.$queryRaw`
            SELECT 
                p.name AS product, 
                p.id AS product_id,
                op.count AS count,
                o.createdAt AS 'time',
                ct.id AS category_id,
                ct.name AS category,
                ct.description AS category_description,
                b.name AS branch,
                b.id AS branch_id,
                c.id AS company_id,
                c.name AS company
            FROM "order" o
            INNER JOIN order_products op ON o.id = op.order_id
            INNER JOIN product p ON op.product_id = p.id
            INNER JOIN branch b ON p.branch_id = b.id
            INNER JOIN company c ON c.id = b.company_id
            INNER JOIN category ct ON ct.id = p.category_id
            WHERE o.id = ${order_id} AND o.user_id = ${user_id}`;
    }

    async order(user_id: string, dtos: OrderProductDto[]) {
        // NOTE(umut): it is not checking if the user exists because in order
        // to buy a product one would need the bearer token and it is checked
        // if the token subject user does exists or not
        if (!(await this.findById(user_id))) {
            throw new NotFoundException(
                `User with the id '${user_id}' was not found`,
            );
        }
        for (let dto of dtos) {
            const product = await this.db.product.findUnique({
                where: { id: dto.product_id },
            });
            if (!product) {
                throw new NotFoundException(
                    `No product with the id '${dto.product_id}' was found`,
                );
            } else if (product.stock < dto.count) {
                throw new BadRequestException(
                    `Product with the id '${dto.product_id}' has not enough stock`,
                );
            }
        }

        const order_id = uuid4();
        await this.db.order.create({
            data: {
                id: order_id,
                user_id: user_id,
            },
        });

        for (let dto of dtos) {
            await this.db.product.update({
                where: { id: dto.product_id },
                data: { stock: { decrement: dto.count } },
            });

            await this.db.orderProducts.create({
                data: {
                    order_id: order_id,
                    product_id: dto.product_id,
                    count: dto.count,
                },
            });
        }

        return await this.getOrder(user_id, order_id);
    }

    /** Delete order and increment the stock of every product in the order by the count it was ordered */
    async deleteOrder(order_id: string) {
        const order_products: {
            order_id: string;
            product_id: string;
            count: number;
        }[] = await this.db.orderProducts.findMany({ where: { order_id } });
        for (let order_product of order_products) {
            await this.db.product.update({
                where: { id: order_product.product_id },
                data: { stock: { increment: order_product.count } },
            });
        }
        if (order_products.length > 0) {
            await this.db.orderProducts.deleteMany({
                where: { order_id: order_id },
            });
        }
        return await this.db.order.delete({
            where: { id: order_id },
            omit: { user_id: true },
        });
    }
}
