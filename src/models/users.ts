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
  brotherId?: mongoose.Types.ObjectId; 
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    countryCode: {
      type: String,
      default: "+91"
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
    brotherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function ( this: IUser ) {
        return this.role === UserRole.SISTER;
      }     
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);


