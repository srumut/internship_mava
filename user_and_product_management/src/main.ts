import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .addBearerAuth()
        .addSecurityRequirements('bearer')
        .setTitle('User and Product Management API')
        .setDescription(
            'Basic user and product management api to practice NestJS, Prisma ORM, Swagger',
        )
        .setVersion('1.0')
        .addTag('')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, documentFactory, {
        jsonDocumentUrl: 'swagger/json',
        swaggerOptions: {
            defaultModelExpandDepth: 7,
            defaultModelsExpandDepth: 7,
            persistAuthorization: true,
        },
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
