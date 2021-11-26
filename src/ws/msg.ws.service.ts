import { getGlobalPlugin } from "@src/bootstrap";
import { HttpPackageCode } from "@src/class/http-package.class";
import { UserClientConn } from "@src/class/user-client-conn.class";
import { DataModelTool } from "@src/decorators/mongodb-index.decorator";
import { loginProtectFunc } from "@src/middleware/login-protect.middleware";
import { Request } from "express";
import { createRedisAsyncTool } from "@src/functions/redis-async";
import { deleteSessionIDUseUserUUID, fromUserUUIDGetSessionIDMapRedisKey, getFromUserUUIDSessionID } from "@src/model/redis/session";
const { sessionHandler, redis, state, dbConn, logger: mainLogger } = getGlobalPlugin();


const asyncRedis = createRedisAsyncTool(redis)

declare global {
    interface State {
        /**
         *  sid => UserClientConn
         */
        loginUserWsClientConn: Map<string, UserClientConn>;
    }
}
if (state.loginUserWsClientConn == undefined) {
    state.loginUserWsClientConn = new Map();
} else {
    throw Error("loginUserWsClientConn is Exis");
}


export const listen: SetupWsService = async (
    upgrade,
    request,
    socket,
    head,
    ws
) => {
    const sessionTest = await new Promise<boolean>((res) => {
        sessionHandler(request as any, {} as any, async () => {
            const requestExpress = request as unknown as Request;
            if (
                (await loginProtectFunc(requestExpress.session.loginUserUUID))
                    .code == HttpPackageCode.OK
            ) {
                res(true);
            } else {
                res(false);
            }
        });
    });

    if (sessionTest) {
        upgrade(async (client, request) => {
            const requestExpress = request as unknown as Request;
            const newSid = requestExpress.sessionID;
            const userClientConn = new UserClientConn(client, newSid);
            state.loginUserWsClientConn.get(newSid)?.close();
            state.loginUserWsClientConn.set(newSid, userClientConn);
            userClientConn.rawConn.addListener("close", (code, message) => {
                handleCloseConn(code, message, userClientConn);
            });
            console.log(`login ${newSid} success `);
        });
    }
    return sessionTest;
};


/**
 *  如果 websocket 断开连接则
 *  直接退出用户的登录
 * @param code 
 * @param message 
 * @param userClientConn 
 */
async function handleCloseConn(code: number, message: string, userClientConn: UserClientConn) {
    mainLogger.info(`close user websocket conn code: ${code} message:  ${message}`);
    state.loginUserWsClientConn.delete(userClientConn.sid);
    deleteSessionIDUseUserUUID(userClientConn.sid);
}
