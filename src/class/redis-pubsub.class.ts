import { check } from "@src/functions/check";
import { RedisClient } from "redis";
import { promisify } from "util";

class RedisServiceBase {
    _redisClient: RedisClient
    constructor(redisClient: RedisClient) {
        this._redisClient = redisClient.duplicate()
    }
}

interface OnMessage {
    (channel:string, data: string): void
}

export class RedisPub extends RedisServiceBase {
    _channelName: string;
    constructor(redisClient: RedisClient, _channel: string) {
        super(redisClient);
        this._channelName = _channel;
    }
    // 使用 [RedisMessagePackageToString] 构建 message 内容体
    async push(message: string):Promise<number>{
        return await promisify(this._redisClient.publish).call(this._redisClient, this._channelName, message);
    }
}

export class RedisSub extends RedisServiceBase {
    _channelNames: string[];
    constructor(redisClient: RedisClient, _channel: string[]|string,cb:(channel: string, count: number) => void) {
        super(redisClient);

        // 抹去数值和string的区别
        const _channelNames=[_channel].flat();
        // 断言检查
        check(_channelNames.length>0,"监听不能为空");
        this._channelNames = _channelNames;
        this._redisClient.subscribe(this._channelNames);
        this._redisClient.on("subscribe",cb);
    }

    close(){
        this._redisClient.unsubscribe();
        this._redisClient.quit();
    }
    on(onMessage:OnMessage){
        this._redisClient.on("message",onMessage);
    }
}
