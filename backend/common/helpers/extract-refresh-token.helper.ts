import { Request } from "express";

export const extractRefreshToken = (req: Request) : string  => {
    return req?.cookies?.refresh_token;
}