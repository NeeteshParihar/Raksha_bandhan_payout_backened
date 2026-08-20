import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
}

export interface IUser {
  phoneNumber: string;
  name: string;
  password?: string;
  role: UserRole;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      // Password is only required for brothers // dynamic required
      required: function (this: IUser) {
        return this.role === UserRole.BROTHER;
      },
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
