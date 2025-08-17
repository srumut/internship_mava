import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Patch,
    Body,
    NotFoundException,
    UseGuards,
    HttpStatus,
    Logger,
    Req,
    BadRequestException,
    UnauthorizedException,
    HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuardAdmin } from 'src/auth/auth.guard.admin';
import { AuthGuardUser } from 'src/auth/auth.guard.user';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { OrderProductDto } from './dto/order.dto';
import { Order, UserOrder, ReturnUserDto } from './types';
import { Public } from '../public.decorator';

@Controller('users')
export class UsersController {
    private logger: Logger;

    constructor(private readonly service: UsersService) {
        this.logger = new Logger(UsersController.name);
    }

    @ApiOperation({ summary: 'Admin only, retrieve all the users' })
    @ApiOkResponse({
        description: 'Successfully retrieved all the users',
        type: [ReturnUserDto],
    })
    @UseGuards(AuthGuardAdmin)
    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @ApiOperation({ summary: 'Admin only, get an user by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the user',
        type: ReturnUserDto,
    })
    @ApiNotFoundResponse({
        description: 'User with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Get('id/:id')
    async findById(@Param('id') id: string) {
        const user = await this.service.findById(id);
        if (!user) {
            throw new NotFoundException(
                `No user with the id '${id}' was found`,
            );
        }
        return user;
    }

    @ApiOperation({ summary: 'Get user by username' })
    @ApiOkResponse({
        description: 'Successfully retrieved the user with the given username',
        type: ReturnUserDto,
    })
    @ApiUnauthorizedResponse()
    @ApiNotFoundResponse({
        description: 'User with the given id was not found',
    })
    @UseGuards(AuthGuardUser)
    @Get('u/:username')
    async findByUsername(
        @Param('username') username: string,
        @Req() req: Request,
    ) {
        if (req['user'].role === 'user' && req['user'].username !== username) {
            throw new UnauthorizedException();
        }
        const user = await this.service.findByUsername(username);
        if (!user) {
            throw new NotFoundException(
                `No user with the username ${username} was found`,
            );
        }
        return user;
    }

    @Public()
    @ApiOperation({ summary: 'Create an user' })
    @ApiCreatedResponse({
        description: 'User created successfully',
        type: ReturnUserDto,
    })
    @ApiConflictResponse({
        description: 'A property that must be unique already exists',
    })
    @Post()
    async create(@Body() dto: CreateUserDto) {
        try {
            return await this.service.create(dto);
        } catch (error) {
            switch (error.code) {
                case 'P2002':
                    throw new BadRequestException(
                        `Unique constraint failed for ${error.meta.target}`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({ summary: 'Admin only, delete an user by id' })
    @ApiOkResponse({
        description: 'Successfully deleted the user',
        type: ReturnUserDto,
    })
    @ApiNotFoundResponse({
        description: 'User with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Delete('id/:id')
    async delete(@Param('id') id: string) {
        try {
            return await this.service.delete(id);
        } catch (error) {
            switch (error.code) {
                case 'P2025':
                    throw new NotFoundException(
                        `No user with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({
        summary:
            'Delete user by username, users can delete only their own account.',
    })
    @ApiOkResponse({
        description: 'Successfully deleted the user',
        type: ReturnUserDto,
    })
    @ApiUnauthorizedResponse()
    @ApiNotFoundResponse({
        description: 'User with the given id does not exist',
    })
    @UseGuards(AuthGuardUser)
    @Delete('u/:username')
    async deleteByUsername(
        @Req() req: Request,
        @Param('username') username: string,
    ) {
        if (req['user'].role === 'user' && req['user'].username !== username) {
            throw new UnauthorizedException();
        }

        const user = await this.service.findByUsername(username, {
            id: true,
        });
        if (!user) {
            throw new NotFoundException(
                `No user with the username ${username} was found`,
            );
        }

        try {
            return await this.service.delete(user.id);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    @ApiOperation({ summary: 'Admin only endpoint to update an user by id' })
    @ApiOkResponse({
        description: 'Successfully updated the user',
        type: ReturnUserDto,
    })
    @ApiNotFoundResponse({
        description: 'User with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Patch('id/:id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        try {
            return await this.service.update(id, dto);
        } catch (error) {
            switch (error.code) {
                case 'P2025':
                    throw new NotFoundException(
                        `No user with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({
        summary:
            'Update user by username, users can update only their own account.',
    })
    @ApiOkResponse({
        description: 'Successfully updated the user',
        type: ReturnUserDto,
    })
    @ApiNotFoundResponse({
        description: 'User with the given id does not exist',
    })
    @ApiBadRequestResponse({
        description: 'Unique constraint failed for one of the fields',
    })
    @ApiUnauthorizedResponse()
    @UseGuards(AuthGuardUser)
    @Patch('u/:username')
    async updateByUsername(
        @Req() req: Request,
        @Param('username') username: string,
        @Body() dto: UpdateUserDto,
    ) {
        if (req['user'].role === 'user' && req['user'].username !== username) {
            throw new UnauthorizedException();
        }

        const user = await this.service.findByUsername(username, {
            id: true,
        });
        if (!user) {
            throw new NotFoundException(
                `No user with the username ${username} was found`,
            );
        }

        try {
            return await this.service.update(user.id, dto);
        } catch (error) {
            switch (error.code) {
                case 'P2002':
                    throw new BadRequestException(
                        `Unique contraint failed for ${error.meta.target}`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({
        summary:
            'Admin only endpoint to retrieve all the orders made by every user',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved orders.',
        type: [UserOrder],
    })
    @UseGuards(AuthGuardAdmin)
    @Get('orders')
    async findAllOrders() {
        return await this.service.findAllOrders();
    }

    @ApiOperation({
        summary: 'Users can retrieve all orders made by them',
    })
    @ApiOkResponse({ description: 'Successfully retrieved orders.' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
    @ApiResponse({ type: [Order] })
    @UseGuards(AuthGuardUser)
    @Get('u/:username/orders')
    async userOrders(@Param('username') username: string, @Req() req: Request) {
        if (req['user'].role === 'user' && username !== req['user'].username) {
            throw new UnauthorizedException();
        }
        return await this.service.findAllOrdersByUser(username);
    }

    @ApiOperation({ summary: 'User only, order products' })
    @ApiCreatedResponse({
        description: 'Products ordered successfully',
        type: Order,
    })
    @ApiBadRequestResponse({
        description:
            'Either an admin tried to order or stock for the one or more products are not enough',
    })
    @ApiNotFoundResponse({
        description: 'User or product with given id do not exist',
    })
    @ApiBody({ type: [OrderProductDto] })
    @UseGuards(AuthGuardUser)
    @Post('orders')
    async order(@Req() req: Request, @Body() dtos: OrderProductDto[]) {
        if (req['user'].role == 'admin') {
            throw new BadRequestException('Admins can not order any product');
        }
        return await this.service.order(req['user'].sub, dtos);
    }

    @UseGuards(AuthGuardUser)
    @ApiNoContentResponse({
        description: 'Given order of the user is deleted successfully',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('u/:username/orders/:order_id')
    async deleteOrder(
        @Param('username') username: string,
        @Param('order_id') order_id: string,
        @Req() req: Request,
    ) {
        if (req['user'].role === 'user' && username !== req['user'].username) {
            throw new UnauthorizedException();
        }
        try {
            return await this.service.deleteOrder(order_id);
        } catch (error) {
            switch (error.code) {
                case 'P2025':
                    throw new BadRequestException(
                        `Order with the id '${order_id}' could not be found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }
}
