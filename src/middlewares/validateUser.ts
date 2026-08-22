import { NextFunction, Response, Request } from "express";
import { ApiError } from "../utils/error_handling.js";
import { validateAccessToken } from "../utils/jwt.js";
import { IapiRequest } from "../utils/types.js";


export const validateUser = async (req: IapiRequest, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies?.accessToken;
        console.log(req.cookies);
        if (!accessToken) {
            throw new ApiError({statusCode: 401,message: "Unauthorized Request: Access token is missing"});
        }

        const decodedUser = validateAccessToken(accessToken);

        req.user = decodedUser;
        next();
    } catch (err) {
        next(new ApiError({statusCode: 401,message: "Unauthorized Request: Access token is missing"}));
    }
}
