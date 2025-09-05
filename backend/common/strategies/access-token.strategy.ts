import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { extractAccessToken } from "common/helpers";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor() {
        super({
            jwtFromRequest: extractAccessToken,
            secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET!,
        });
    }

    validate(payload: any) {
        return payload;
    }
}