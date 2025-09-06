import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from './constants';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthGuardUser implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly db: DatabaseService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: jwtConstants.secret,
            });
            const user = await this.db.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                const admin = await this.db.admin.findUnique({
                    where: { id: payload.sub },
                });
                if (!admin) throw Error();
            }

            request['user'] = payload;
        } catch (e) {
            throw new UnauthorizedException();
        }
        return true;
    }
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
