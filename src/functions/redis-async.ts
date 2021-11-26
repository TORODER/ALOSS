import { RedisClient } from "redis";
import { promisify } from "util";


export function createRedisAsyncTool(redis: RedisClient) {
    const redisAsyncGet = promisify(redis.get).bind(redis);
    const redisAsyncSet = promisify(redis.set).bind(redis);
    return {
        get: redisAsyncGet,
        set: redisAsyncSet
    }
}