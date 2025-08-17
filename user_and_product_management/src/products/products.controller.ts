import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    UseGuards,
    Logger,
    Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuardUser } from 'src/auth/auth.guard.user';
import { AuthGuardAdmin } from 'src/auth/auth.guard.admin';
import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
} from '@nestjs/swagger';
import { ProductRespDto } from './dto/product-resp.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
    private logger: Logger;

    constructor(private readonly service: ProductsService) {
        this.logger = new Logger(ProductsController.name);
    }

    @ApiOperation({ summary: 'Retrieve all products' })
    @ApiOkResponse({
        description: 'Successfully retrieved all the products',
        type: [ProductRespDto],
    })
    @UseGuards(AuthGuardUser)
    @ApiQuery({ name: 'branch_id', required: false, type: 'string' })
    @ApiQuery({ name: 'company_id', required: false, type: 'string' })
    @ApiQuery({ name: 'category_id', required: false, type: 'string' })
    @ApiQuery({ name: 'min_stock', required: false, type: 'number' })
    @ApiQuery({ name: 'max_stock', required: false, type: 'number' })
    @Get()
    async findAll(@Req() req: Request) {
        return await this.service.findAll(req['query']);
    }

    @ApiOperation({ summary: 'Retrieve product by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the product',
        type: ProductRespDto,
    })
    @ApiNotFoundResponse({
        description: 'Product with the given id does not exist',
    })
    @UseGuards(AuthGuardUser)
    @Get(':id')
    async findById(@Param('id') id: string) {
        const product = await this.service.findById(id);
        if (!product) {
            throw new NotFoundException(
                `No product with the id '${id}' was found`,
            );
        }
        return product;
    }

    @ApiOperation({ summary: 'Admin only endpoin to create a product' })
    @ApiCreatedResponse({
        description: 'Successfully created the product',
        type: ProductRespDto,
    })
    @ApiConflictResponse({
        description: 'One or more properties that must be unique already exist',
    })
    @ApiBadRequestResponse({
        description: 'Given branch does not have the given category',
    })
    @ApiNotFoundResponse({
        description: 'Company with the given id does not exists',
    })
    @UseGuards(AuthGuardAdmin)
    @Post()
    async create(@Body() dto: CreateProductDto) {
        try {
            return await this.service.create(dto);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            switch (error.code) {
                case 'P2002':
                    throw new BadRequestException(
                        `Unique contraint failed for ${error.meta.target}`,
                    );
                // NOTE(umut): if branch exist or not is checked within the
                // service, so P2003 can only mean bad company_id
                case 'P2003':
                    throw new NotFoundException(
                        `Category with the id '${dto.category_id}' was not found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({
        summary: 'Admin only endpoint to delete an existing product',
    })
    @ApiOkResponse({
        description: 'Product deleted successfully',
        type: ProductRespDto,
    })
    @ApiNotFoundResponse({
        description: 'Product with the given id does not exist',
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
                        `No product with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({
        summary: 'Admin only endpoint to delete an existing product',
    })
    @ApiOkResponse({
        description: 'Product updated successfully',
        type: ProductRespDto,
    })
    @ApiNotFoundResponse({
        description: 'Product with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
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
                        `No product with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }
}
