
import crypto from "crypto";

export const generateCouponCode = (prefix: string = "RAKHI"): string => {
  // Generate 12 random alphanumeric characters
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomPart = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    randomPart += characters[randomIndex];
  }  
  
  // Format as PREFIX-XXXX-XXXX-XXXX
  return `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8)}`;
}

