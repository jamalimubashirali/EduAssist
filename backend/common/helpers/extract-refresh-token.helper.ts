import { Request } from "express";

export const extractRefreshToken = (req: Request) : string | null => {
    const token = req?.cookies?.refresh_token;
    console.log(`🔍 Extracting refresh token: ${token ? 'Found' : 'Not found'}`);
    return token || null;
}