import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    NotFoundException,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuardUser } from 'src/auth/auth.guard.user';
import { AuthGuardAdmin } from 'src/auth/auth.guard.admin';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
} from '@nestjs/swagger';
import { CategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
    private logger: Logger;
    constructor(private readonly service: CategoriesService) {
        this.logger = new Logger(CategoriesController.name);
    }

    @ApiOperation({ summary: 'Retrieve all categories' })
    @ApiOkResponse({
        description: 'Successfully retrieved all categories',
        type: [CategoryDto],
    })
    @UseGuards(AuthGuardUser)
    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @ApiOperation({ summary: 'Retrieve a category by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the category',
        type: CategoryDto,
    })
    @ApiNotFoundResponse({
        description: 'Category with the given id was not found',
    })
    @UseGuards(AuthGuardUser)
    @Get(':id')
    async findById(@Param('id') id: string) {
        const category = await this.service.findById(id);
        if (!category) {
            throw new NotFoundException(
                `Category with the id '${id}' was not found`,
            );
        }
        return category;
    }

    @ApiOperation({ summary: 'Admin only endpoint to crate a category' })
    @ApiCreatedResponse({
        description: 'Category created successfully',
        type: CategoryDto,
    })
    @ApiBadRequestResponse({ description: 'Unique constraint failed' })
    @UseGuards(AuthGuardAdmin)
    @Post()
    async create(@Body() dto: CreateCategoryDto) {
        try {
            return await this.service.create(dto);
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

    @ApiOperation({ summary: 'Admin only endpoint to delete a category' })
    @ApiOkResponse({
        description: 'Successfully deleted the category',
        type: CategoryDto,
    })
    @ApiNotFoundResponse({
        description: 'Category with the given was not found',
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
                        `No category with the id '${id}' was found`,
                    );
                case 'P2003':
                    throw new BadRequestException(
                        'There are products in this category',
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({ summary: 'Admin only endpoint to update a category' })
    @ApiOkResponse({
        description: 'Successfully updated the category',
        type: CategoryDto,
    })
    @ApiBadRequestResponse({ description: 'Unique contraint failed' })
    @ApiNotFoundResponse({
        description: 'Category with the given id was not found',
    })
    @UseGuards(AuthGuardAdmin)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
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
                        `No category with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }
}
