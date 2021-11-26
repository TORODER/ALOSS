import { json as parserJson } from "body-parser";
import { installRouter } from "@src/functions/setup-router";
import { getGlobalPlugin } from "@src/bootstrap";
import {
    emailAttrTest,
    testCodeAttrTest
} from "@src/middleware/attr-test.middleware";
import {
    EmailExisError,
    EmailUser,
    selectEmailUserInfoResult
} from "@src/model/email-user.model";
import R from "ramda";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
import { formatEmailAttr } from "@src/middleware/format.middleware";
import { loginProtect } from "@src/middleware/login-protect.middleware";
import { ServiceUnit } from "@src/functions/service-unit-packer";
import { promisify } from "util";
import { SessionData } from "express-session";
import { PubUserLoginMsg } from "@src/pubsub/pub/user-online.pub";
import { createRedisAsyncTool } from "@src/functions/redis-async";
import { sessionIDUserUUIDTwoMapPrefix } from "@src/config/app.config";
import { deleteSessionIDUseUserUUID, getFromUserUUIDSessionID, setSessionIDUseUserUUID, fromUserUUIDGetSessionIDMapRedisKey } from "@src/model/redis/session";
import { LoginSession } from "@src/@types/session-data";

// 从 bootstrap 获取插件

const { dbConn, sessionStore, redis } = getGlobalPlugin();
const redisAsync = createRedisAsyncTool(redis);



interface inputSignUpStruct {
    email: string;
    passwd: string;
    testCode: string;
}

interface inputSignInStruct {
    email: string;
    passwd: string;
}

interface inputSelectEmailUsers {
    email?: string;
    username?: string;
}


interface inputSelectOneEmailUser {
    email?: string;
    uuid?: string;
}


export const {
    service: signUpPost,
    schemaType: testSignUpInputStruct,
    serviceRaw: EmailSignUpUser,
} = ServiceUnit<inputSignUpStruct, string, inputSignUpStruct>(
    async (signupData) => {
        const signUpUser = new EmailUser({
            email: signupData.email,
            passwd: signupData.passwd,
        });
        const insertResult = await signUpUser.insert(dbConn);
        switch (true) {
            case R.is<any>(EmailExisError, insertResult.err):
                return new HttpPackage({
                    code: HttpPackageCode.SignUpErrorEmailIsExis,
                    data: signupData.email,
                    describe: "邮箱已经被注册",
                });
        }
        return new HttpPackage({
            code: HttpPackageCode.OK,
            data: signupData.email,
        });
    },
    {
        properties: {
            email: { type: "string" },
            passwd: { type: "string" },
            testCode: { type: "string" },
        },
    }
);


// 登录接口
export const {
    service: signInPost,
    schemaType: testSignInInputStruct,
    serviceRaw: EmailSignInUser,
} = ServiceUnit<
    inputSignInStruct & LoginSession & RequestSessionSid,
    { email: string },
    inputSignInStruct
>(
    async (signInData) => {
        const emailUser = await EmailUser.selectOne(dbConn, {
            email: signInData.email,
        });
        switch (true) {
            case emailUser == undefined: {
                return new HttpPackage({
                    code: HttpPackageCode.UserNotExis,
                    data: { email: signInData.email },
                    describe: "用户不存在"
                });
            }
            case emailUser!.passwd != signInData.passwd: {
                return new HttpPackage({
                    code: HttpPackageCode.LoginPasswdError,
                    data: { email: emailUser!.email },
                    describe: "账号或密码错误"
                });
            }
            default:
                {
                    signInData.session.loginUserUUID = emailUser!.uuid;
                    let oldSid;
                    if (signInData.session.loginUserUUID != undefined) {
                        // 通过 UserUUID => Sid(sessionID) 的映射
                        // 获取到 sessionID
                        const sidKey = await getFromUserUUIDSessionID(signInData.session.loginUserUUID);
                        // 映射和当前sid被匹配
                        if (sidKey != signInData.sessionSid) {
                            // 映射过旧
                            if (sidKey != undefined) {
                                // 删除旧映射的数据(删除旧映射)
                                // oldId
                                oldSid = sidKey;
                                await deleteSessionIDUseUserUUID(sidKey)
                            }
                            // 设置新映射
                            await setSessionIDUseUserUUID(signInData.session.loginUserUUID, signInData.sessionSid);
                        }
                    }
                    // 通知其他节点该用户登录了
                    PubUserLoginMsg({
                        uuid: emailUser!.uuid,
                        newSid: signInData.sessionSid,
                        oldSid: oldSid
                    });
                    return new HttpPackage({
                        code: HttpPackageCode.OK,
                        data: { email: emailUser!.email, uuid: emailUser?.uuid },
                    });
                }
        }
    },
    {
        properties: {
            email: { type: "string" },
            passwd: { type: "string" },
        },
    },
    {
        serviceAdapter: (req) => ({ ...req.body, session: req.session, sessionSid: req.sessionID }),
    }
);

export const {
    serviceRaw: selectEmailUsers,
    service: selectEmailUsersGet,
    schemaType: testSelectEmailUsersStruct,
} = ServiceUnit<
    inputSelectEmailUsers,
    selectEmailUserInfoResult[],
    inputSelectEmailUsers
>(
    async (queryData) => {
        const data = await EmailUser.select(dbConn, queryData);
        return new HttpPackage({ code: HttpPackageCode.OK, data: data });
    },
    {
        optionalProperties: {
            email: {
                type: "string",
            },
            username: {
                type: "string",
            },
        },
        additionalProperties: false,
    },
    {
        serviceAdapter: "query",
        schemaTypeAdapter: "query",
    }
);

const {
    service: selectOneUserGet,
    schemaType: testSelectOneInputStruct,
    serviceRaw: selectOneEmailUser,
} = ServiceUnit<
    inputSelectOneEmailUser,
    selectEmailUserInfoResult | undefined,
    inputSelectOneEmailUser
>(
    async (queryData) => {
        if (queryData.email != undefined || queryData.uuid != undefined) {
            const data = await EmailUser.selectOne(dbConn, queryData);
            if (data != undefined) {
                return new HttpPackage({
                    code: HttpPackageCode.OK,
                    data: {
                        email: data!.email,
                        username: data!.username,
                        uuid: data!.uuid,
                        headPortrait: data.headPortrait,
                    },
                });
            } else {
                return new HttpPackage({
                    code: HttpPackageCode.UserNotExis,
                    data: undefined,
                });
            }
        } else {
            return new HttpPackage({
                code: HttpPackageCode.ParameterTestError,
                data: undefined,
            });
        }
    },
    {
        optionalProperties: {
            email: {
                type: "string",
            },
            uuid: {
                type: "string",
            },
        },
    },
    {
        serviceAdapter: "query",
        schemaTypeAdapter: "query",
    }
);

interface InputTestUpdateUserInfo {
    username?: string;
    headPortrait?: string;
}

const { service: updateUserInfoPost, schemaType: testInputUpdateUserInfo } =
    ServiceUnit<
        InputTestUpdateUserInfo & LoginSession,
        boolean,
        InputTestUpdateUserInfo
    >(
        async (queryData) => {
            const loginUserUUID = queryData.session.loginUserUUID;
            const user = (await EmailUser.selectOne(dbConn, {
                uuid: loginUserUUID,
            }))!;
            let needUpdate = false;
            if (queryData.headPortrait != undefined) {
                user.headPortrait = queryData.headPortrait;
                needUpdate = true;
            }
            if (queryData.username != undefined) {
                user.username = queryData.username;
                needUpdate = true;
            }
            if (needUpdate) {
                user.update(dbConn);
            }
            return new HttpPackage({
                code: HttpPackageCode.OK,
                data: true,
            });
        },
        {
            optionalProperties: {
                headPortrait: {
                    type: "string",
                },
                username: {
                    type: "string",
                },
            },
        },
        {
            serviceAdapter: (req) => ({ ...req.body, session: req.session }),
        }
    );

interface SelectALLLoginUserResult {
    loginUserList: Array<string>;
}

const {
    service: selectAllLoginUserGet,
    schemaType: testInputSelectAllLoginUser,
    serviceRaw: selectAllLoginUser,
} = ServiceUnit<any, SelectALLLoginUserResult, any>(async (data) => {
    if (sessionStore.all != undefined) {
        const result = [await promisify(sessionStore.all).call(sessionStore)]
            .flat(1)
            .filter((v) => (v ?? undefined) != undefined) as SessionData[];
        const loginUsers = result
            .map((e) => e.loginUserUUID)
            .filter((v) => v != undefined) as string[];
        return new HttpPackage({
            code: HttpPackageCode.OK,
            data: {
                loginUserList: loginUsers,
            },
        });
    } else {
        return new HttpPackage({
            code: HttpPackageCode.GeneralError,
            data: { loginUserList: [] },
        });
    }
}, {});

// setup 用于挂载到 express上
// 并且将 express 传递过来的数据进行处理后 传递给业务函数
export const setup: SetupService = async function setup(app) {
    const parserJsoner = parserJson();
    const testInBodyEmailAttr = emailAttrTest((req) => req.body["email"]);
    const testInBodyTestCodeAttr = testCodeAttrTest((req) => ({
        email: req.body["email"],
        testCode: req.body["testCode"],
    }));
    const transformEmailAttr = formatEmailAttr(
        (req) => (req.body as inputSignUpStruct | inputSignInStruct).email,
        (req, email) =>
            ((req.body as inputSignUpStruct | inputSignInStruct).email = email)
    );

    installRouter(app, [
        {
            path: "/user",
            middleware: [parserJsoner],
            child: [
                {
                    path: "/signup",
                    on: {
                        post: [
                            testSignUpInputStruct,
                            testInBodyEmailAttr,
                            transformEmailAttr,
                            testInBodyTestCodeAttr,
                            signUpPost,
                        ],
                    },
                },
                {
                    path: "/signin",
                    on: {
                        post: [
                            testSignInInputStruct,
                            testInBodyEmailAttr,
                            transformEmailAttr,
                            signInPost,
                        ],
                    },
                },
            ],
        },
        {
            path: "/users",
            middleware: [parserJsoner, loginProtect],
            child: [
                {
                    path: "/online",
                    middleware: [testInputSelectAllLoginUser],
                    on: {
                        get: [selectAllLoginUserGet],
                    },
                },
            ],
        },
        {
            path: "/userdata",
            middleware: [parserJsoner, loginProtect],
            child: [
                {
                    path: "/select",
                    on: {
                        get: [testSelectEmailUsersStruct, selectEmailUsersGet],
                    },
                },
                {
                    path: "/selectone",
                    on: {
                        get: [testSelectOneInputStruct, selectOneUserGet],
                    },
                },
                {
                    path: "/updateinfo",
                    on: {
                        post: [testInputUpdateUserInfo, updateUserInfoPost],
                    },
                },
            ],
        },
    ]);
};
