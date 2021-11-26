import { getGlobalPlugin } from "@src/bootstrap";
import { RedisSubSetup } from "@src/bootstrap/redis-sub";
import { StringToRedisMessagePackage } from "@src/class/redis-package.class";
import { RedisSub } from "@src/class/redis-pubsub.class";
import { RedisUserLoginMessagePackage, UserLoginPubChannelName, UserLoginPubChannelPackageCode } from "../pub/user-online.pub";
const globalPlugin = getGlobalPlugin();
export const setup: RedisSubSetup = (redisClient) => {
    const userLoginSub = new RedisSub(redisClient, UserLoginPubChannelName, () => undefined);
    userLoginSub.on((channelName, data) => {
        const _rmp = StringToRedisMessagePackage(data) as RedisUserLoginMessagePackage;

        switch (_rmp.code) {
            // 让 oldSid 下线
            case UserLoginPubChannelPackageCode.UserLogin:
                {
                    _rmp.data.forEach(msg => {
                        // 如果存在 oldSid
                        if (msg.oldSid != undefined) {
                            const oldWsConn = globalPlugin.state.loginUserWsClientConn.get(msg.oldSid);
                            if (oldWsConn) {
                                oldWsConn.sendLoginFromAnother().finally(() => {
                                    oldWsConn.close();
                                });
                            }
                        }
                    });
                    break;
                }
        }
        console.log([channelName, data]);
    })
}