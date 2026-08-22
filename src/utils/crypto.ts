import crypto from "crypto";

export const  generateAlphanumericOTP = (length = 6) => {

  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    otp += characters[randomIndex];
  }  
  return otp;
}

