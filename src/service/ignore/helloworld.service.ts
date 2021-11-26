import { installRouter } from "@src/functions/setup-router";
import { RequestHandler, Router } from "express";
import { HttpPackage, HttpPackageCode } from "../../class/http-package.class";
import {getGlobalPlugin} from "@src/bootstrap";

// 从 bootstrap 获取插件

const {dbConn,logger,emailer}=getGlobalPlugin();
interface inputLoginStruct {
    phoneNumber: string;
    passwd: string;
}
// 这是个演示示例在 /test/helloworld 输出helloworld 和 访问者的ip

const GetHelloworld: MiniServiceInterfaceBase<Record<string, string>> =
    async (options: { ip: string }) => {
        return new HttpPackage({
            code: HttpPackageCode.OK,
            data: {
                ip: options.ip,
                info: "HelloWorld",
            },
            describe: "is helloworld test functions",
        });
    };

const setup: SetupService = async function setup(app) {
    const helloworld: RequestHandler = async (req, res) =>
        (
            await GetHelloworld(
                {
                    ip: req.ip,
                }
            )
        ).end(res);
    installRouter(app, [
        {
            path: "/test",
            child: [
                {
                    path: "/helloworld",
                    on: {
                        all: helloworld,
                    },
                },
            ],
        },
    ]);
};

export { setup };
