import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Request } from "express";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { extractRefreshToken } from "common/helpers";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy , 'jwt-refresh'){
    private readonly logger = new Logger(RefreshTokenStrategy.name);

    constructor() {
        super({
            jwtFromRequest : extractRefreshToken,
            secretOrKey : process.env.JWT_REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-key',
            passReqToCallback : true,
            ignoreExpiration: false,
        });

        // Log the secret being used (first 10 chars only for security)
        const secret = process.env.JWT_REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-key';
        this.logger.log(`🔑 Refresh token secret configured: ${secret.substring(0, 10)}...`);
    }

    validate(req: Request, payload: any) {
        this.logger.log(`🔍 Refresh token validation attempt`);

        const refreshToken = req.cookies?.refresh_token;
        this.logger.log(`🍪 Refresh token in cookies: ${refreshToken ? 'Found' : 'Not found'}`);

        if (!refreshToken) {
            this.logger.warn(`❌ No refresh token found in cookies`);
            throw new UnauthorizedException('No refresh token found in cookies');
        }

        this.logger.log(`✅ Refresh token validation successful for user: ${payload.sub}`);
        return { ...payload, refreshToken };
    }
}