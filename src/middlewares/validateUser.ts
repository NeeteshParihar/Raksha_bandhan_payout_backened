import { NextFunction, Response } from "express";
import { ApiError } from "../utils/error_handling.js";
import { validateAccessToken } from "../utils/jwt.js";
import { IapiRequest } from "../utils/types.js";
import { getValueRedis } from "../services/redis.js";

export const validateUser = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies?.accessToken;
        
        if (!accessToken) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized Request: Access token is missing" });
        }
        const decodedUser = validateAccessToken(accessToken);
        const blockedToken = await getValueRedis({ prefix: "BLOCKED_TOKEN", key: accessToken });
        if (blockedToken.value) {
            throw new ApiError({ statusCode: 401, message: "Unauthorized Request: Token is revoked" });
        }
        req.user = decodedUser;
        next();
    } catch (err) {
        if (err instanceof ApiError) {
            return next(err);
        }
        next(new ApiError({ statusCode: 401,  message: "Unauthorized Request: Invalid or expired token" }));
    }
};

