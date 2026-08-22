
import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID as string ;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;

const client = twilio(accountSid, authToken);
export default client;

