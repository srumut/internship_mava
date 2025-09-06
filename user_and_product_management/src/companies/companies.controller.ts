import {
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
    BadRequestException,
} from '@nestjs/common';
import { AuthGuardAdmin } from 'src/auth/auth.guard.admin';
import {
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
} from '@nestjs/swagger';
import { AuthGuardUser } from 'src/auth/auth.guard.user';
import { CompaniesService } from './companies.service';
import { CompanyDto } from './dto/company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchDto } from './dto/branch.dto';

@Controller('companies')
export class CompaniesController {
    private logger: Logger;
    constructor(private readonly service: CompaniesService) {
        this.logger = new Logger(CompaniesController.name);
    }

    @ApiOperation({ summary: 'Retrieve all companies' })
    @ApiOkResponse({
        description: 'Successfully retrieved all the companies',
        type: [CompanyDto],
    })
    @UseGuards(AuthGuardUser)
    @Get()
    async findAll() {
        return await this.service.findAll();
    }

    @ApiOperation({ summary: 'Retrieve all branches of all companies' })
    @ApiOkResponse({
        description: 'Successfully retrieved all the branches',
        type: [BranchDto],
    })
    @UseGuards(AuthGuardUser)
    @Get('branches')
    async findAllBranches() {
        return await this.service.findAllBranches();
    }

    @ApiOperation({ summary: 'Retrieve a company by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the company',
        type: CompanyDto,
    })
    @ApiNotFoundResponse({
        description: 'Company with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Get(':id')
    async findById(@Param('id') id: string) {
        const company = await this.service.findById(id);
        if (!company) {
            throw new NotFoundException(
                `Company with the id '${id}' was not found`,
            );
        }
        return company;
    }

    @ApiOperation({ summary: 'Admin only, create a company' })
    @ApiCreatedResponse({
        description: 'Company created successfully',
        type: CompanyDto,
    })
    @UseGuards(AuthGuardAdmin)
    @Post()
    async create(@Body() dto: CreateCompanyDto) {
        try {
            return await this.service.create(dto);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    @ApiOperation({ summary: 'Admin only, delete a company by id' })
    @ApiOkResponse({
        description: 'Successfully deleted the company',
        type: CompanyDto,
    })
    @ApiNotFoundResponse({
        description: 'Company with the given id does not exist',
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
                        `No company with the id '${id}' was found`,
                    );
                case 'P2003':
                    throw new BadRequestException(
                        `This company can not be deleted because there are branches associated with it`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({ summary: 'Admin only, update a company by id' })
    @ApiOkResponse({
        description: 'Successfully updated the company',
        type: CompanyDto,
    })
    @ApiNotFoundResponse({
        description: 'Company with the given id does not exist',
    })
    @UseGuards(AuthGuardAdmin)
    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
        try {
            return await this.service.update(id, dto);
        } catch (error) {
            switch (error.code) {
                case 'P2025':
                    throw new NotFoundException(
                        `No company with the id '${id}' was found`,
                    );
                default:
                    this.logger.error(error);
                    throw error;
            }
        }
    }

    @ApiOperation({ summary: 'Retrive a branch by id' })
    @ApiOkResponse({
        description: 'Successfully retrieved the branch',
        type: [BranchDto],
    })
    @UseGuards(AuthGuardUser)
    @Get('branches/:id')
    async findBranchById(@Param('id') id: string) {
        return await this.service.findBranchById(id);
    }

    @ApiOperation({ summary: 'Admin only, create a branch' })
    @ApiOkResponse({
        description: 'Successfully created the branch',
        type: [BranchDto],
    })
    @UseGuards(AuthGuardAdmin)
    @Post('branches')
    async createBranch(@Body() dto: CreateBranchDto) {
        try {
            return await this.service.createBranch(dto);
        } catch (error) {
            switch (error?.code) {
                case 'P2003':
                    throw new NotFoundException(
                        `No company with the id ${dto.company_id} was found`,
                    );
            }
        }
    }

    @ApiOperation({ summary: 'Admin only, delete a branch by id' })
    @ApiOkResponse({
        description: 'Successfully deleted the branch',
        type: [BranchDto],
    })
    @UseGuards(AuthGuardUser)
    @Delete('branches/:id')
    async deleteBranch(@Param('id') id: string) {
        return await this.service.deleteBranch(id);
    }

    @ApiOperation({ summary: 'Admin only, update a branch by id' })
    @ApiOkResponse({
        description: 'Successfully updated the branch',
        type: [BranchDto],
    })
    @UseGuards(AuthGuardAdmin)
    @Patch('branches/:id')
    async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
        return await this.service.updateBranch(id, dto);
    }

    @ApiOperation({
        summary: 'Retrieve all categories available on the given branch',
    })
    @ApiOkResponse({
        description:
            'Successfully retrieved all the categories given branch has',
    })
    @UseGuards(AuthGuardUser)
    @Get('branches/:id/categories')
    async findAllCategoriesForTheGivenBranch(@Param('id') id: string) {
        return await this.service.findCategoriesForTheGivenBranch(id);
    }

    @ApiOperation({ summary: 'Admin only, add a category to the branch' })
    @ApiCreatedResponse({
        description: 'Given category successfully added to the given branch',
    })
    @UseGuards(AuthGuardAdmin)
    @Post('branches/{:branch_id}/categories/{:category_id}')
    async addGivenCategoryToTheGivenBranch(
        @Param('branch_id') branch_id: string,
        @Param('category_id') category_id: string,
    ) {
        try {
            return await this.service.addGivenCategoryToTheGivenBranch(
                branch_id,
                category_id,
            );
        } catch (error) {
            switch (error?.code) {
                case 'P2002':
                    throw new BadRequestException(
                        `Branch with the id '${branch_id}' already has the category with the id '${category_id}'`,
                    );
                case 'P2003':
                    throw new NotFoundException(
                        `No category with the id ${category_id} was found`,
                    );
            }
            this.logger.error(error);
            throw error;
        }
    }

    @ApiOperation({ summary: 'Admin only, remove a category from the branch' })
    @ApiOkResponse({
        description: 'Given category successfully removed from given branch',
    })
    @UseGuards(AuthGuardAdmin)
    @Delete('branches/{:branch_id}/categories/{:category_id}')
    async removeGivenCategoryFromTheGivenBranch(
        @Param('branch_id') branch_id: string,
        @Param('category_id') category_id: string,
    ) {
        try {
            return await this.service.removeGivenCategoryFromTheGivenBranch(
                branch_id,
                category_id,
            );
        } catch (error) {
            switch (error?.code) {
                case 'P2025':
                    throw new BadRequestException(
                        `Invalid branch_id or category_id`,
                    );
            }
            this.logger.error(error);
            throw error;
        }
    }
}
