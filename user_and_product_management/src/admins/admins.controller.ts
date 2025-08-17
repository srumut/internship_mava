import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Patch,
    Body,
    BadRequestException,
    NotFoundException,
    UseGuards,
    Logger,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AuthGuardAdmin } from 'src/auth/auth.guard.admin';
import {
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
} from '@nestjs/swagger';
import { ReturnAdminDto } from './dto/admin.dto';

@Controller('admins')
export class AdminsController {
    private logger: Logger;

    constructor(private readonly service: AdminsService) {
        this.logger = new Logger(AdminsController.name);
    }

    @ApiOperation({ summary: 'Admin only, retrieve all admins' })
    @ApiOkResponse({
        description: 'Successfully retrieved all the admins',
        type: [ReturnAdminDto],
    })
    @UseGuards(AuthGuardAdmin)
    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @ApiOperation({ summary: 'Admin only, retrieve the admin by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the admin',
        type: ReturnAdminDto,
    })
    @ApiNotFoundResponse({
        description: 'Admin with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Get(':id')
    async findById(@Param('id') id: string) {
        const admin = await this.service.findById(id);
        if (!admin) {
            throw new NotFoundException(
                `No admin with the id '${id}' was found`,
            );
        }
        return admin;
    }

    @ApiOperation({ summary: 'Admin only, create an admin' })
    @ApiCreatedResponse({
        description: 'Admin created successfully',
        type: ReturnAdminDto,
    })
    @ApiConflictResponse({
        description: 'A property that must be unique already exists',
    })
    @UseGuards(AuthGuardAdmin)
    @Post()
    async create(@Body() dto: CreateAdminDto) {
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

    @ApiOperation({ summary: 'Admin only, delete an admin by id' })
    @ApiOkResponse({
        description: 'Successfully deleted the admin',
        type: ReturnAdminDto,
    })
    @ApiNotFoundResponse({
        description: 'Admin with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Delete(':id')
    async delete(@Param('id') id: string) {
        try {
            return await this.service.delete(id);
        } catch (error) {
            switch (error.code) {
                case 'P2025':
                    throw new NotFoundException(
                        `No admin with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({ summary: 'Admin only, update an admin' })
    @ApiOkResponse({
        description: 'Successfully updated the admin',
        type: ReturnAdminDto,
    })
    @ApiNotFoundResponse({
        description: 'Admin with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
        try {
            return await this.service.update(id, dto);
        } catch (error) {
            switch (error.code) {
                case 'P2002':
                    throw new BadRequestException(
                        `Unique contraint failed for ${error.meta.target}`,
                    );
                case 'P2025':
                    throw new NotFoundException(
                        `No admin with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }
}
