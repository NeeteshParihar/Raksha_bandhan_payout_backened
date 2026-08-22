
import { Request } from "express";
import type { UserRole } from "../models/users.js";

export interface IapiRequest extends Request {
    user?: {
        userId: string,
        role: UserRole
    };
}