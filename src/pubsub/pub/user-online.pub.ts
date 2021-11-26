import { RedisMessagePackage, RedisMessagePackageToString } from "@src/class/redis-package.class";
import { RedisPub } from "@src/class/redis-pubsub.class";
import { getGlobalPlugin } from "@src/bootstrap";
const globalPlugin=getGlobalPlugin();
export const UserLoginPubChannelName="UserLoginChannel";
export enum UserLoginPubChannelPackageCode {
    // RedisPackageCode start from 1000
    UserLogin = 1000,
}

// 缓存
let _cachePub:RedisPub|undefined=undefined;
function getPub(){
    _cachePub??=new RedisPub(globalPlugin.redis, UserLoginPubChannelName);
    return _cachePub;
}


interface UserLoginSessionConfig{
    uuid:string,
    newSid:string,
    oldSid?:string,
}

export interface RedisUserLoginMessagePackage extends RedisMessagePackage<any> {
    data: UserLoginSessionConfig[]
}


export async function PubUserLoginMsg(userUUID: UserLoginSessionConfig|UserLoginSessionConfig[]):Promise<void> {
    const UserLoginPubChannel = getPub();
    const _package: RedisUserLoginMessagePackage = {
        "code": UserLoginPubChannelPackageCode.UserLogin,
        "data": [userUUID].flat()
    };
    await UserLoginPubChannel.push(RedisMessagePackageToString(_package));
}