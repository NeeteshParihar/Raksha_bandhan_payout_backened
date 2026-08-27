import client from "../config/sms_twilo.js"
import { ApiError } from "../utils/error_handling.js"

interface ISMS {
    phoneNumber: string,
    message: string
}

export const sendSMS = async ({
    phoneNumber,
    message
}: ISMS) => {
    console.log(`sending messages to ${phoneNumber}`);
    try{
        await client.messages.create({
            body: message,
            from : process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
    }catch(err: any) {
        throw new ApiError({statusCode: 500, message: err?.message || "SMS service error"})
    }
}
