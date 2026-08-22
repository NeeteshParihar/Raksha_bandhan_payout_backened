import bcrypt from "bcryptjs";
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt.
 * @param password The plain text password to hash.
 * @returns A promise that resolves to the hashed password string.
 */
export const hashPassword = async (password: string, rounds = SALT_ROUNDS): Promise<string> => {
    return await bcrypt.hash(password, rounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param password The plain text password.
 * @param hash The hashed password to compare against.
 * @returns A promise that resolves to true if passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};
