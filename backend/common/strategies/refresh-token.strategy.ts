import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Request } from "express";
import { Injectable } from "@nestjs/common";
import { extractRefreshToken } from "common/helpers";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy , 'jwt-refresh'){
    constructor() {
        super({
            jwtFromRequest : extractRefreshToken,
            secretOrKey : process.env.JWT_REFRESH_TOKEN_SECRET!,
            passReqToCallback : true,
        });
    }

    validate(req: Request, payload: any) {
        const refreshToken = req.cookies?.refresh_token;
        return { ...payload, refreshToken };
    }
}