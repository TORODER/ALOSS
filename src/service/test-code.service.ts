import { Router, Request, RequestHandler } from "express";
import { json as parserJson } from "body-parser";
import { ajvBodyMiddlewareStructPacker } from "../middleware/ajv-packer.middleware";
import { installRouter } from "@src/functions/setup-router";
import { getGlobalPlugin } from "@src/bootstrap";

import { appName } from "@src/config/app.config";
import { buildTestCode } from "@src/functions/builder/test-code.html";
import { TestCode } from "@src/model/test-code.model";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";

import { emailAttrTest } from "@src/middleware/attr-test.middleware";
import { mail } from "@src/config/email.config";
import { formatEmailAttr } from "@src/middleware/format.middleware";

// 从 bootstrap 获取插件

const { dbConn, logger, emailer } = getGlobalPlugin();

interface InputVerifiTestCodeStruct {
    email: string;
    testCode: string;
}

interface InputSendTestCodeStruct {
    email: string;
}

export const VerifiTestCode: MiniServiceInterfaceBase<
    boolean,
    InputVerifiTestCodeStruct & { autoDelete?: boolean }
> = async (data) => {
    const { autoDelete = true } = data;
    const selectData = await TestCode.select(dbConn, { email: data.email });
    switch (true) {
        case selectData == undefined:
            return new HttpPackage({
                code: HttpPackageCode.EmailTestCodeIsNotExis,
                data: false,
            });
        case selectData!.testCode != data.testCode:
            return new HttpPackage({
                code: HttpPackageCode.EmailTestCodeError,
                data: false,
            });
        case selectData!.isTimeOut():
            return new HttpPackage({
                code: HttpPackageCode.EmailTestCodeTimeOut,
                data: false,
            });
        default: {
            if (autoDelete) {
                selectData?.delete(dbConn);
            }
            return new HttpPackage({
                code: HttpPackageCode.OK,
                data: true,
            });
        }
    }
};

export const SendSignUpTestCode: MiniServiceInterfaceBase<
    { email: string },
    InputSendTestCodeStruct
> = async (sendTestCodeInfo) => {
    const newTestCode = new TestCode({ email: sendTestCodeInfo.email });
    const insertState = await newTestCode.insert(dbConn);
    const code = newTestCode.testCode;
    emailer.sendMail({
        from: mail,
        to: sendTestCodeInfo.email,
        subject: `${appName} Email Test Code`,
        html: buildTestCode({ testCode: code }),
    });

    return new HttpPackage({
        code: HttpPackageCode.OK,
        data: { email: sendTestCodeInfo.email },
    });
};

// setup 用于挂载到 express上
// 并且将 express 传递过来的数据进行处理后 传递给业务函数
export const setup: SetupService = async function setup(app) {
    const parserJsoner = parserJson();

    const sendTestEmailPost: RequestHandler = async (req, res) => {
        const httpPackage = await SendSignUpTestCode(
            req.body as InputSendTestCodeStruct
        );
        httpPackage.end(res);
    };

    const testInputTestCodeStruct =
        ajvBodyMiddlewareStructPacker<InputSendTestCodeStruct>(() => ({
            properties: {
                email: {
                    type: "string",
                },
            },
        }));

    const testInBodyEmailAttr = emailAttrTest((req) => req.body["email"]);

    const transformEmailAttr = formatEmailAttr(
        (req) => (req.body as InputSendTestCodeStruct).email,
        (req, email) => ((req.body as InputSendTestCodeStruct).email = email)
    );

    installRouter(app, [
        {
            path: "/testcode",
            middleware: [parserJsoner],
            child: [
                {
                    path: "/send",
                    on: {
                        post: [
                            testInputTestCodeStruct,
                            testInBodyEmailAttr,
                            transformEmailAttr,
                            sendTestEmailPost,
                        ],
                    },
                },
            ],
        },
    ]);
};
