import { getGlobalPlugin } from "@src/bootstrap";
import { RedisSubSetup } from "@src/bootstrap/redis-sub";
import { StringToRedisMessagePackage } from "@src/class/redis-package.class";
import { RedisSub } from "@src/class/redis-pubsub.class";
import {
    Forwarding,
    ForwardingPubChannelPackageCode,
    RedisForwardingPackage,
} from "../pub/forwarding.pub";

const globalPlugin = getGlobalPlugin();

export const setup: RedisSubSetup = (redisClient) => {
    const userLoginSub = new RedisSub(redisClient, Forwarding, () => undefined);
    userLoginSub.on(async (channelName, data) => {
        const _rmp = StringToRedisMessagePackage(
            data
        ) as RedisForwardingPackage;
        switch (_rmp.code) {
            case ForwardingPubChannelPackageCode.Forwarding:
                {
                    const getWsClientConnData = await findTargetConnFromLocalState(_rmp.data.targetSessionID);
                    // 判断目标是否存在在本实例
                    if (getWsClientConnData != undefined) {
                        // 目标存在
                        // 进行转发
                        getWsClientConnData.sendForwarding(_rmp.data.data);
                    }
                    break;
                }
        }
        console.log([channelName, data]);
    });
};



/**
 * 查询转发目标是否存在在本地
 * @param sid 目标的 SessionID
 * @returns 
 */
export async function findTargetConnFromLocalState(sid: string) {
    const wsClientConnMap = globalPlugin.state.loginUserWsClientConn;
    if (sid && wsClientConnMap.has(sid)) {
        const wsClientConnData = wsClientConnMap.get(sid)!;
        return wsClientConnData;
    } else {
        return undefined;
    }
}
