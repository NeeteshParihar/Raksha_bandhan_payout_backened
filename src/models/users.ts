import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
}

export interface IUser {
  phoneNumber: string;
  countryCode?: string;
  name: string;
  password?: string;
  role: UserRole;
  brothersId?: mongoose.Types.ObjectId[]; 
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]+$/, 'Phone number should contain only digits'],
      minlength: 10,
      maxlength: 12
    },
    countryCode: {
      type: String,
      default: "+91",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
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
    brothersId: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
      }],
      default: []
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ countryCode: 1, phoneNumber: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);


