import { Request } from "express"

export const extractAccessToken = (req : Request) => {
    return req?.cookies?.access_token;
}