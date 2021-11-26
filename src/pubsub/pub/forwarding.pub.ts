import { RedisMessagePackage, RedisMessagePackageToString } from "@src/class/redis-package.class";
import { RedisPub } from "@src/class/redis-pubsub.class";
import { getGlobalPlugin } from "@src/bootstrap";
const globalPlugin=getGlobalPlugin();
export const Forwarding="ForwardingChannel";


export enum ForwardingPubChannelPackageCode{
    Forwarding=1001
}

// 缓存
let _cachePub:RedisPub|undefined=undefined;
function getPub(){
    _cachePub??=new RedisPub(globalPlugin.redis, Forwarding);
    return _cachePub;
}


export interface ForwardingPackage{
    targetSessionID:string,
    data:string,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RedisForwardingPackage extends RedisMessagePackage<ForwardingPackage>{}


export async function PubForwardingMsg(forwardingPackage:ForwardingPackage):Promise<void> {
    const UserLoginPubChannel = getPub();
    const _package:RedisForwardingPackage={
        "code":ForwardingPubChannelPackageCode.Forwarding,
        "data":forwardingPackage
    };
    await UserLoginPubChannel.push(RedisMessagePackageToString(_package));
}

