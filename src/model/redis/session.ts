import { getGlobalPlugin } from "@src/bootstrap";
import { sessionIDUserUUIDTwoMapPrefix } from "@src/config/app.config";
import { createRedisAsyncTool } from "@src/functions/redis-async";
import { promisify } from "util";
const { dbConn, sessionStore, redis } = getGlobalPlugin();
const redisAsync = createRedisAsyncTool(redis);

/**
 * 从用户的UUID 获取 映射到 Redis 的关于 SessionID 的 Key
 * @param uuid 
 * @returns sessionIDMapRedisKey
 */
export function fromUserUUIDGetSessionIDMapRedisKey(uuid:string):string{
    return `${sessionIDUserUUIDTwoMapPrefix}${uuid}`;
}
export async function getFromUserUUIDSessionID(userUUID:string):Promise<string|undefined>{
    return await redisAsync.get(fromUserUUIDGetSessionIDMapRedisKey(userUUID))??undefined;
}

export async function setSessionIDUseUserUUID(userUUID:string,sessionSid:string):Promise<void>{
    await redisAsync.set(fromUserUUIDGetSessionIDMapRedisKey(userUUID), sessionSid);
}

export async function deleteSessionIDUseUserUUID(sessionID:string):Promise<void>{
    await promisify(sessionStore.destroy).call(sessionStore, sessionID);
}