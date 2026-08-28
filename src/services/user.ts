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
    if (existingUser.role !== UserRole.SISTER) {
      throw new ApiError({
        statusCode: 400,
        message: "User with this phone number already exists and is not a sister",
      });
    }

    const brotherObjectId = new mongoose.Types.ObjectId(brotherId);
    const hasBrother = existingUser.brothersId?.some(id => String(id) === brotherId);

    if (!hasBrother) {
      existingUser.brothersId?.push(brotherObjectId);
      await existingUser.save();
    }

    return {
      _id: String(existingUser._id),
      countryCode: existingUser.countryCode,
      phoneNumber: existingUser.phoneNumber,
      name: existingUser.name,
      role: existingUser.role,
      brothersId: existingUser.brothersId?.map(id => String(id)) || []
    };
  }

  const hashedPassword = await hashPassword(phoneNumber);

  const newUser = await User.create({
    phoneNumber,
    name,
    password: hashedPassword,
    role: UserRole.SISTER,
    brothersId: [new mongoose.Types.ObjectId(brotherId)],
  });

  return {
    _id: String(newUser._id),
    countryCode: newUser.countryCode,
    phoneNumber: newUser.phoneNumber,
    name: newUser.name,
    role: newUser.role,
    brothersId: newUser.brothersId?.map(id => String(id)) || []
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
  return await User.find({ brothersId: brotherId, role: UserRole.SISTER }).select('-password').lean();
};

// change
export const deleteSisterAccountService = async (brotherId: string, sisterId: string) => {
  const sister = await User.findOne({
    _id: new mongoose.Types.ObjectId(sisterId),
    brothersId: brotherId,
    role: UserRole.SISTER
  });

  if (!sister) {
    throw new ApiError({
      statusCode: 404,
      message: "Sister account not found or you are not authorized to delete it.",
    });
  }

  sister.brothersId = sister.brothersId?.filter(id => String(id) !== brotherId);
  await sister.save()
  return sister;
};

export const getAllbroOfSisService = async (sisterId: string) => {
  const sister = await User.findById(sisterId).select('brothersId').populate('brothersId', '-password');
  return sister?.brothersId || [];
}

interface RegisterUserParams {
  phoneNumber: string;
  countryCode?: string;
  name: string;
  password: string;
  role: UserRole;
}

export const registerUserService = async ({ phoneNumber,countryCode, name, password, role }: RegisterUserParams) => {
  const existingUser = await User.findOne({ phoneNumber, countryCode });
  if (existingUser) {
    throw new ApiError({
      statusCode: 400,
      message: "User with this phone number already exists. Please login.",
    });
  }
  const hashedPassword =  await hashPassword(password);

  const newUser = await User.create({
    phoneNumber,
    countryCode,
    name,
    role,
    password: hashedPassword,
  });

  return {
    _id: String(newUser._id),
    countryCode: newUser.countryCode,
    phoneNumber: newUser.phoneNumber,
    name: newUser.name,
    role: newUser.role,
    brothersId: newUser.brothersId?.map((id: any) => String(id)) || []
  };
};

interface LoginUserParams {
  phoneNumber: string;
  countryCode: string;
  password: string;
  role: UserRole;
}

export const loginUserService = async ({ phoneNumber, countryCode, password, role }: LoginUserParams) => {
  const user = await User.findOne({ phoneNumber, countryCode });
  if (!user) {
    throw new ApiError({
      statusCode: 404,
      message: "User not found",
    });
  }

  if (user.role !== role) {
    throw new ApiError({
      statusCode: 403,
      message: `User is not a ${role.toLowerCase()}`,
    });
  }

  if (!user.password) {
    throw new ApiError({
      statusCode: 401,
      message: "Password is not set for this account. Please use OTP login or set a password.",
    });
  }

  const isPasswordValid = await comparePassword(password, user.password);
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
    role: user.role,
    brothersId: user.brothersId?.map((id: any) => String(id)) || []
  };
};

export const updatePasswordService = async (userId: string, password: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError({
      statusCode: 404,
      message: "User not found",
    });
  }

  const hashedPassword = await hashPassword(password);
  user.password = hashedPassword;
  await user.save();

  return true;
};

