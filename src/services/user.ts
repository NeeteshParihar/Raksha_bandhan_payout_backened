import mongoose from "mongoose";
import { ApiError } from "../utils/error_handling.js";
import { User, UserRole } from "../models/users.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

interface RegisterBrotherParams {
  phoneNumber: string;
  name: string;
  password?: string;
}

export const registerBrotherService = async ({ phoneNumber, name, password }: RegisterBrotherParams) => {
  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    throw new ApiError({
      statusCode: 400,
      message: "User with this phone number already exists",
    });
  }

  if (!password) {
    throw new ApiError({
      statusCode: 400,
      message: "Password is required for brothers",
    });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await User.create({
    phoneNumber,
    name,
    role: UserRole.BROTHER,
    password: hashedPassword,
  });

  return {
    _id: String(newUser._id),
    countryCode: newUser.countryCode,
    phoneNumber: newUser.phoneNumber,
    name: newUser.name,
    role: newUser.role,
  };
};

interface RegisterSisterParams {
  phoneNumber: string;
  name: string;
  brotherId: string;
}

export const registerSisterService = async ({ phoneNumber, name, brotherId }: RegisterSisterParams) => {
  const existingUser = await User.findOne({ phoneNumber });
  if (existingUser) {
    throw new ApiError({
      statusCode: 400,
      message: "User with this phone number already exists",
    });
  }

  const newUser = await User.create({
    phoneNumber,
    name,
    role: UserRole.SISTER,
    brotherId,
  });

  return {
    _id: String(newUser._id),
    countryCode: newUser.countryCode,
    phoneNumber: newUser.phoneNumber,
    name: newUser.name,
    role: newUser.role,
    brotherId: newUser.brotherId ? String(newUser.brotherId) : undefined
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

export const getSistersByBrotherId = async (brotherId: string) => {
  return await User.find({ brotherId, role: UserRole.SISTER }).select('-password').lean();
};

export const deleteSisterAccountService = async (brotherId: string, sisterId: string) => {
  const deletedSister = await User.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(sisterId),
    brotherId,
    role: UserRole.SISTER
  });

  if (!deletedSister) {
    throw new ApiError({
      statusCode: 404,
      message: "Sister account not found or you are not authorized to delete it.",
    });
  }

  return deletedSister;
};

export const getAllbroOfSisService = async (sisterId: string) => {
  
}


