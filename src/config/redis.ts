import { createClient } from 'redis';

const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD;
const userName = process.env.default;


export const redisClient = createClient({
    username: userName,
    password: redisPassword,
    socket: {
        host: redisHost,
        port: Number(redisPort)
    }
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("connected to redis successfuly");
    } catch (err) {
        console.error("error connecting to error", err);
    }
}


redisClient.on('error', err => console.error('Redis Client Error', err));


