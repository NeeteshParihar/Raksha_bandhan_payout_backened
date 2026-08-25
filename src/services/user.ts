import { ApiError } from "../utils/error_handling.js";
import { User, UserRole } from "../models/users.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

interface RegisterUserParams {
  phoneNumber: string;
  name: string;
  role: UserRole;
  password?: string;
  brotherId?: string;
}

export const registerUserService = async ({ phoneNumber, name, role, password, brotherId }: RegisterUserParams) => {
  // Check if a user with this phone number already exists
  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    throw new ApiError({
      statusCode: 400,
      message: "User with this phone number already exists",
    });
  }

  // Validate that brother provides a password
  if (role === UserRole.BROTHER && !password) {
    throw new ApiError({
      statusCode: 400,
      message: "Password is required for brothers",
    });
  }

  // Hash the password if one is provided
  let hashedPassword = password;
  if (password) {   
    hashedPassword = await hashPassword(password);
  }

  // Create and save the new user
  const newUser = await User.create({
    phoneNumber,
    name,
    role,
    password: hashedPassword,
    brotherId,
  });

  return {
    _id: String(newUser._id),
    countryCode: newUser.countryCode,
    phoneNumber: newUser.phoneNumber,
    name: newUser.name,
    role: newUser.role
  };
};
interface LoginBrotherParams {
  phoneNumber: string;
  countryCode: string;
  password: string;
}

export const loginBrotherService = async ({ phoneNumber, countryCode, password }: LoginBrotherParams) => {
  
  const user = await User.findOne({ phoneNumber, countryCode });
  if (!user) {
    throw new ApiError({
      statusCode: 404,
      message: "User not found",
    });
  }

  if (user.role !== UserRole.BROTHER) {
    throw new ApiError({
      statusCode: 403,
      message: "User is not a brother",
    });
  }

  const isPasswordValid = await comparePassword(password, user.password!);
  if (!isPasswordValid) {
    throw new ApiError({
      statusCode: 401,
      message: "Invalid credentials",
    });
  }

  return {
    _id: String(user._id),
    countryCode: user.countryCode,
    phoneNumber: user.phoneNumber,
    name: user.name,
    role: user.role
  };
};

export const checkIsSister = async (id: string): Promise<boolean> => {
  const user = await User.findById(id);
  if (!user) return false;
  return user.role === UserRole.SISTER;
};

export const checkIsBrother = async (id: string): Promise<boolean> => {
  const user = await User.findById(id);
  if (!user) return false;
  return user.role === UserRole.BROTHER;
};

export const getUser = async (id: string, selectAttributes?: string[]) => {
  let query = User.findById(id).lean();
  if (selectAttributes && selectAttributes.length > 0) {
    query = query.select(selectAttributes.join(' '));
  }
  return await query;
};
