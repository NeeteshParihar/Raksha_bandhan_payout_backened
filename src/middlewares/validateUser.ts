import { NextFunction, Response, Request } from "express";
import { ApiError } from "../utils/error_handling.js";
import { validateAccessToken } from "../utils/jwt.js";
import { IapiRequest } from "../utils/types.js";
import type { UserRole } from "../models/users.js";


export const validateUser = (resiredRole: UserRole | undefined ) => {
    return async (req: IapiRequest, res: Response, next: NextFunction) => {
        try {
            const accessToken = req.cookies?.accessToken;
            console.log(req.cookies);
            if (!accessToken) {
                throw new ApiError({ statusCode: 401, message: "Unauthorized Request: Access token is missing" });
            }

            const decodedUser = validateAccessToken(accessToken);
            if(decodedUser.role !== resiredRole ) {
                throw new ApiError({ statusCode: 403, message: "Forbidden only brothers have previlig for this action!" });
            }
            req.user = decodedUser;
            next();
        } catch (err) {
            if (err instanceof ApiError) {
                return next(err);
            }
            next(new ApiError({ statusCode: 401,  message: "Unauthorized Request: Access token is missing" }));
        }
    }
}
