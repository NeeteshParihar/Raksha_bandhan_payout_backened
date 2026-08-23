import { NextFunction, Response } from "express";
import { ApiError } from "../utils/error_handling.js";
import { IapiRequest } from "../utils/types.js";
import type { UserRole } from "../models/users.js";

export const validateUserRole = (desiredRole: UserRole | UserRole[]) => {
    return (req: IapiRequest, res: Response, next: NextFunction) => {
        try {
            const userRole = req.user?.role;

            if (!userRole) {
                throw new ApiError({ statusCode: 401, message: "Unauthorized Request: User role is missing" });
            }

            const isRoleValid = Array.isArray(desiredRole) 
                ? desiredRole.includes(userRole as UserRole) 
                : desiredRole === userRole;

            if (!isRoleValid) {
                throw new ApiError({ statusCode: 403, message: "Forbidden: You do not have the required permissions for this action" });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

