import { Router, Request, RequestHandler } from "express";
import { json as parserJson } from "body-parser";
import { ajvBodyMiddlewareStructPacker } from "../../middleware/ajv-packer.middleware";
import { installRouter } from "@src/functions/setup-router";
import {getGlobalPlugin} from "@src/bootstrap";

// 从 bootstrap 获取插件

const {dbConn,logger,emailer}=getGlobalPlugin();
interface inputLoginStruct {
    phoneNumber: string;
    passwd: string;
}

// 真正处理业务逻辑的 函数
export const ExampleLoginUser: MiniServiceInterfaceBase<
    string,
    inputLoginStruct & { session: Request["session"] }
> = async (loginData) => {
    throw Error("Is No Define");
};

// setup 用于挂载到 express上
//并且将 express 传递过来的数据进行处理后 传递给业务函数
export const setup: SetupService = async function setup(app) {
    const parserJsoner = parserJson();
    const testInputLoginStruct =
        ajvBodyMiddlewareStructPacker<inputLoginStruct>(() => ({
            properties: {
                phoneNumber: { type: "string" },
                passwd: { type: "string" },
            },
        }));
    const ExampleLoginUserPost: RequestHandler = (req, res) =>
        ExampleLoginUser(
            { ...(req.body as inputLoginStruct), session: req.session }
        );
    installRouter(app, [
        {
            path: "/user",
            child: [
                {
                    path: "/login",
                    middleware: [parserJsoner],
                    on: {
                        post: [testInputLoginStruct,ExampleLoginUserPost],
                    },
                },
            ],
        },
    ]);
};
