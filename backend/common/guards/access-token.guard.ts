import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "common/decorators/public_endpoint.decorators";

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt-access') {
    private readonly logger = new Logger(AccessTokenGuard.name);

    constructor(private reflector : Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const route = `${request.method} ${request.url}`;

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        this.logger.log(`🔒 AccessTokenGuard: ${route} - isPublic: ${isPublic}`);

        if(isPublic){
            this.logger.log(`✅ Public route, skipping auth: ${route}`);
            return true;
        }

        this.logger.log(`🔐 Protected route, checking auth: ${route}`);
        return super.canActivate(context);
    }
}
