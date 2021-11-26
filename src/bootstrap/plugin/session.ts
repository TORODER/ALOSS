import { RunServerConfig } from "@src/config/static.config";
import redis from "redis";
import timeUnit from "@src/functions/time-unit";
import RedisStore from "connect-redis";
import expressSession from "express-session";
import { RequestHandler } from "express";
import { promisify } from "util";
import { initRedis } from "./redis";

const RedisStoreF = RedisStore(expressSession);

export async function  initSession(options: RunServerConfig) {
    const redisClient = await initRedis();
    const rsf = new RedisStoreF({
        client: redisClient,
        prefix: options.mongoSessionPrefixName
    });
    const rawSessionHandle = expressSession({
        cookie: {
            maxAge: timeUnit.hour * 3,
        },
        resave: true,
        saveUninitialized: true,
        secret: options.sessionSecrets,
        //cookie save to redis
        store: rsf,
        name: options.sessionName,
    });
    const proxySessionHandler: RequestHandler = (req, res, next) => {
        rawSessionHandle(req, res, async () => {
            next();
        });
    };
    return {
        handler: proxySessionHandler,
        store: rsf
    };
}