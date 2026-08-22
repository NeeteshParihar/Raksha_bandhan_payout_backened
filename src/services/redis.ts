import {redisClient as client} from "../config/redis.js";
import jwt ,  { type JwtPayload} from 'jsonwebtoken'; 

export const maxRateLimit = 100;
const WINDOW_SIZE_IN_SECONDS = 60;

export interface IRateLimitStatus { remainingReqLeft: number; ttlLeft: number; }

export interface IRateLimiterHelpers {
  isUserAllowed: () => Promise<boolean>;
  getRateLimitStatus: () => Promise<IRateLimitStatus>;
}


/**
 * Checks if the user is allowed to make a request based on rate limit.
 * Uses a fixed window size of 60 seconds.
 * 
 * @param userId The ID of the user.
 * @returns boolean True if allowed, false if rate limit exceeded.
 */export const isUserAllowed = async (userId: string, endpoint: string, rateLimit = maxRateLimit, ttl = WINDOW_SIZE_IN_SECONDS): Promise<boolean> => {
  const key = `rate_limit:${userId}:${endpoint}`;

  // 1. Run INCR and check the TTL in a single transaction
  const replies = await client.multi()
    .incr(key)
    .ttl(key)
    .exec();

  const count = replies[0] as unknown as number;
  const currentTtl = replies[1] as unknown as number;

  // 2. If it's the very first request (count is 1) OR if the key somehow lost its TTL (-1), set the expiration
  if (count === 1 || currentTtl === -1) {
    await client.expire(key, ttl);
  }
  return count <= rateLimit;
};

/**
 * Gets the remaining requests and time left in the current rate limit window.
 * 
 * @param userId The ID of the user.
 * @returns Object containing remainingReqLeft and ttlLeft
 */
export const getRateLimitStatus = async (userId: string, endpoint: string, rateLimit = maxRateLimit): Promise<IRateLimitStatus> => {

  const key = `rate_limit:${userId}:${endpoint}`;

  const replies = await client.multi()
    .get(key)
    .ttl(key)
    .exec();

  const countStr = replies[0] as unknown as string | null;
  const ttl = replies[1] as unknown as number;

  const count = countStr ? parseInt(countStr, 10) : 0;
  let remainingReqLeft = rateLimit - count;
  if (remainingReqLeft < 0) {
    remainingReqLeft = 0;
  }

  // ttl is -2 if key does not exist, -1 if key exists but has no associated expire // if it exists it gives us number of seconds left till it expires 
  let ttlLeft = ttl;
  if (ttlLeft < 0) {
    ttlLeft = 0;
  }

  return {
    remainingReqLeft,
    ttlLeft
  };

};

export const getRateLimiterHelpers = (userId: string, endpoint: string, rateLimit = 100, ttl = 60): IRateLimiterHelpers => {
  return {
    isUserAllowed: async () => await isUserAllowed(userId, endpoint, rateLimit, ttl),
    getRateLimitStatus: async () => await getRateLimitStatus(userId, endpoint, rateLimit)
  }
}

/**
 * Blocks a JWT by storing it in Redis until its expiration time.
 * 
 * @param token The JWT string to block.
 */
export const blockJWT = async (token: string) => {

  const payload = jwt.verify(token, process.env.SECRET_KEY as string) as JwtPayload;
  // now the jwt is verified i.e its correct and not expired yet , so we have to store it in redis to prevent its further use 
  const key = `blockedJWT:${token}`;

  const ttl = (payload.exp as number) - Math.floor(Date.now() / 1000);

  if (ttl <= 0) return;
  // Use a transaction to set the key and its expiration atomically
  await client.set(key, "1", { EX: ttl });
};


/**
 * Checks if a JWT token has been blocked.
 * 
 * @param token The JWT string to check.
 * @returns boolean True if blocked, false otherwise.
 */
export const isJWTBlocked = async (token: string): Promise<boolean> => {
  const key = `blockedJWT:${token}`;
  const exists = await client.exists(key);
  return exists === 1;
};

export interface IStoreValueRedis {
  prefix: string;
  key: string;
  value: string;
  ttl: number;
}

export interface IGetOrDeleteValueRedis {
  prefix: string;
  key: string;
}

export const storeValueRedis = async ({ prefix, key, value, ttl }: IStoreValueRedis) => {
  const redisKey = `${prefix}:${key}`;
  await client.set(redisKey, value, { EX: ttl });
};

export const deleteValueRedis = async ({ prefix, key }: IGetOrDeleteValueRedis): Promise<boolean> => {
  const redisKey = `${prefix}:${key}`;
  const result = await client.del(redisKey);
  return result > 0;
};

export const checkValueExistsRedis = async ({ prefix, key }: IGetOrDeleteValueRedis): Promise<boolean> => {
  const redisKey = `${prefix}:${key}`;
  const exists = await client.exists(redisKey);
  return exists === 1;
};

export const getValueRedis = async ({ prefix, key }: IGetOrDeleteValueRedis) => {
  const redisKey = `${prefix}:${key}`;
  const replies = await client.multi()
    .get(redisKey)
    .ttl(redisKey)
    .exec();

  if (!replies) {
    return { value: null, ttl: -2 };
  }

  const value = replies[0] as unknown as string | null;
  const ttl = replies[1] as unknown as number;

  return { value, ttl };
};


