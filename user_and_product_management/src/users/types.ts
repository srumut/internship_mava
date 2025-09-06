import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels()
export class Product {
    @ApiProperty({ example: 'programmer-socks' })
    product_id: string;

    @ApiProperty({ example: 'Programmer Socks' })
    product: string;

    @ApiProperty({ example: 1 })
    count: number;

    @ApiProperty({ example: 'Amazon San Francisco' })
    branch: string;

    @ApiProperty({ example: 'amazon-san-francisco' })
    branch_id: string;

    @ApiProperty({ example: 'Programmers Must Have' })
    category: string;

    @ApiProperty({ example: 'programmers-must-have' })
    category_id: string;

    @ApiProperty({
        example: 'Things you must have to become a real programmer',
    })
    category_description: string;

    @ApiProperty({ example: 'Amazon' })
    company: string;

    @ApiProperty({ example: '3c520d6b-cab3-44e7-8346-c33df8aceb93' })
    company_id: string;
}

@ApiExtraModels()
export class Order {
    @ApiProperty({ example: 'c337febb-155f-4740-ba93-b5a2bbc25cd6' })
    order_id: string;

    @ApiProperty()
    time: Date;

    @ApiProperty({ type: [Product] })
    products: Product[];
}

@ApiExtraModels()
export class UserOrder {
    @ApiProperty({ example: 'de5edcf8-e8b8-482d-be4e-b37dab6fd8d5' })
    user_id: string;

    @ApiProperty({ example: 'cooper' })
    username: string;

    @ApiProperty({ example: 'Joseph A.' })
    name: string;

    @ApiProperty({ example: 'Cooper' })
    surname: string;

    @ApiProperty({ type: [Order] })
    orders: Order[];
}

@ApiExtraModels()
export class ReturnUserDto {
    @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
    id: string;

    @ApiProperty({ example: 'neo' })
    username: string;

    @ApiProperty({ example: 'Thomas' })
    name: string;

    @ApiProperty({ example: 'Anderson' })
    surname: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
