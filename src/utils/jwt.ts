import jwt from 'jsonwebtoken';
import { ApiError } from './error_handling.js';
import type { UserRole } from '../models/users.js';
import type { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined");
}


export interface JwtPayload {
    userId: string;
    role: UserRole
}

/**
 * Generates an access token for a given user payload.
 * @param payload The data to encode in the JWT.
 * @returns The generated JWT string.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

/**
 * Validates an access token and returns the decoded payload if valid.
 * @param token The JWT string to validate.
 * @returns The decoded payload if valid
 */
export const validateAccessToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (err) {
        throw new ApiError({statusCode: 401, message: "Invalid JWT"});
    }
};

/**
 * Sets the access token in an HTTP-only cookie.
 * @param res The Express response object.
 * @param token The JWT access token.
 */
export const setAccessTokenCookie = (res: Response, jwtPayload: JwtPayload): void => {
    const accessToken = generateAccessToken(jwtPayload);
    res.cookie("accessToken", accessToken, {
        maxAge: 7*24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
};

