import { Router, Request, RequestHandler } from "express";
import { json as parserJson } from "body-parser";
import { installRouter } from "@src/functions/setup-router";
import { getGlobalPlugin } from "@src/bootstrap";
import { ServiceUnit } from "@src/functions/service-unit-packer";
import { MessageTarget } from "@src/@types/service";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
import { getFromUserUUIDSessionID } from "@src/model/redis/session";
import { findTargetConnFromLocalState } from "@src/pubsub/sub/forwarding.sub";
import { PubForwardingMsg } from "@src/pubsub/pub/forwarding.pub";
import { loginProtect } from "@src/middleware/login-protect.middleware";
import { EmailUser } from "@src/model/email-user.model";
import { TargetType } from "@src/class/ws-package.class";


// 从 bootstrap 获取插件

const { dbConn, logger, emailer } = getGlobalPlugin();

interface inputForwardingPackage {
    targetDescribe: MessageTarget;
    data: string;
}

/**
 *
 * @param messageTarget 接收的结构
 * 目前没有好友的设定 所以 只要用户存在在数据库就判定 为可以发送
 * 目前没有组所以 如果目标是组 则直接失败
 * @returns bool
 */
export const MessageTargetIsExis = async (
    messageTarget: MessageTarget
): Promise<HttpPackage<undefined>> => {
    const getMessageType = messageTarget.type;
    switch (getMessageType) {
        // TODO GROUP
        case TargetType.GROUP:
            {
                return new HttpPackage({
                    code: HttpPackageCode.MessageTargetNoExis,
                    data: undefined,
                });
            }
        case TargetType.SINGLE:
            {
                const target = await EmailUser.selectOne(dbConn, {
                    uuid: messageTarget.targetUUID,
                });
                if (target != undefined) {
                    return new HttpPackage({
                        code: HttpPackageCode.OK,
                        data: undefined,
                    });
                } else {
                    return new HttpPackage({
                        code: HttpPackageCode.MessageTargetNoExis,
                        data: undefined,
                    });
                }
            }
        default:
            {
                return new HttpPackage({
                    code: HttpPackageCode.GeneralError,
                    data: undefined,
                });
            }
    }
};

/**
 *  * 转发服务
 *  提供目标的 [TargetType] [TargetUUID] 就可以确认其目标
 *  从 Redis 中查询得到目标的 [SessionID] 
 *  后查询本地 和通过 广播查询其他实例 是否存在该 SessionID 存在则发送
 *  ! 不能保证转发到达
 */
const recvForwardingPackage = ServiceUnit<
    inputForwardingPackage,
    boolean,
    inputForwardingPackage
>(
    async (data) => {
        const isTargetExis = MessageTargetIsExis(data.targetDescribe);
        // 目标不存在
        if ((await isTargetExis).code != HttpPackageCode.OK) {
            return new HttpPackage({ code: HttpPackageCode.UUIDIsNotExis, data: false });
        }
        // * 根据不同的目标类型
        switch (data.targetDescribe.type) {
            case TargetType.SINGLE: {
                // 从Redis获取sid 
                const sid = await getFromUserUUIDSessionID(data.targetDescribe.targetUUID);
                // 该用户是否在线
                if (sid) {
                    // 查询sid是否存在在本地
                    const connLocalState = await findTargetConnFromLocalState(sid);
                    if (connLocalState) {
                        // * 直接推送
                        connLocalState.sendForwarding(data.data);
                    } else {
                        // * 广播
                        await PubForwardingMsg({
                            targetSessionID: sid,
                            data: data.data
                        });
                    }
                    // * 推送成功
                    return new HttpPackage({ code: HttpPackageCode.OK, data: true });
                } else {
                    // * 目标用户没有登录
                    return new HttpPackage({ code: HttpPackageCode.TargetUserNoTSignIn, data: false });
                }
            }
            // TODO GROUP
            case TargetType.GROUP:
            default:
                // ! 没有命中任何分支
                return new HttpPackage({ code: HttpPackageCode.GeneralError, data: false });
        }
    },
    {
        properties: {
            targetDescribe: {
                properties: {
                    targetUUID: {
                        type: "string",
                    },
                    type: {
                        enum: [TargetType.GROUP, TargetType.SINGLE],
                    },
                },
            },
            data: {
                type: "string",
            },
        },
    }
);
// setup 用于挂载到 express上
// 并且将 express 传递过来的数据进行处理后 传递给业务函数
export const setup: SetupService = async function setup(app) {
    const parserJsoner = parserJson();

    installRouter(app, [
        {
            path: "/forwarding",
            middleware: [parserJsoner, loginProtect],
            child: [
                {
                    path: "/push",
                    on: {
                        post: [
                            recvForwardingPackage.schemaType,
                            recvForwardingPackage.service
                        ]
                    },
                },
            ],
        },
    ]);
};
