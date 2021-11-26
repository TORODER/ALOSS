import { redisHost, redisPort } from "@src/config/static.config";
import redis, { RedisClient } from "redis";
export async function initRedis(): Promise<RedisClient> {
    return redis.createClient({
        host:redisHost,
        port:redisPort
    });
}