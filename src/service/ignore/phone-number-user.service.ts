import { Router, Request, RequestHandler } from "express";
import { json as parserJson } from "body-parser";
import ajv, { JTDSchemaType } from "ajv/dist/jtd";
import {
    ajvBodyMiddlewarePacker,
    ajvBodyMiddlewareStructPacker,
} from "../../middleware/ajv-packer.middleware";
import R, { ascend } from "ramda";
import {
    CommunistMemberData,
    PhoneNumberExisError,
    Sex,
    PhoneNumberUser,
    UserType,
} from "../../model/ignore/phone-number-user.model";
import {
    parsePhoneNumber,
    testStringCNPhoneNumber,
} from "../../functions/phone-number-tool";
import { HttpPackage, HttpPackageCode } from "../../class/http-package.class";
import { installRouter } from "@src/functions/setup-router";


import {getGlobalPlugin} from "@src/bootstrap";
import { LoginSession } from "@src/@types/session-data";
const {dbConn,logger,emailer}=getGlobalPlugin();

interface inputSignupPartyMemberStruct {
    name: string;
    sex: number;
    phoneNumber: string;
    passwd: string;
}

interface inputLoginStruct {
    phoneNumber: string;
    passwd: string;
}

export const SignupPartyMember: MiniServiceInterfaceBase<
    string,
    inputSignupPartyMemberStruct
> = async (signupData) => {
    if (testStringCNPhoneNumber(signupData.phoneNumber)) {
        const sex =
            { [Sex.man]: Sex.man, [Sex.woman]: Sex.woman }[signupData.sex] ??
            Sex.man;
        const parsePhoneNumberResult = parsePhoneNumber(signupData.phoneNumber);
        const newUserObj = new PhoneNumberUser<CommunistMemberData>({
            sex: sex,
            username: signupData.name,
            typeProprietary: new CommunistMemberData(),
            userType: UserType.communistMember,
            phoneNumber: parsePhoneNumberResult,
            passwd: signupData.passwd,
        });
        const insertResult = await newUserObj.insert(dbConn);
        switch (true) {
            case R.is(PhoneNumberExisError, insertResult.err):
                return new HttpPackage({
                    code: HttpPackageCode.SignUpErrorPhoneNumberIsExis,
                    data: signupData.phoneNumber,
                });
        }
        return new HttpPackage({
            code: HttpPackageCode.OK,
            data: newUserObj.phoneNumber,
        });
    } else {
        return new HttpPackage({
            code: HttpPackageCode.ErrorPhoneNumberUnlawful,
            data: signupData.phoneNumber,
        });
    }
};

export const LoginUser: MiniServiceInterfaceBase<
    string,
    inputLoginStruct & LoginSession
> = async (loginData) => {

    const { session, passwd, phoneNumber } = loginData;
    const selectUser = await PhoneNumberUser.select({ phoneNumber: phoneNumber }, dbConn);
    switch (true) {
        case !testStringCNPhoneNumber(loginData.phoneNumber):
            return new HttpPackage({
                code: HttpPackageCode.ErrorPhoneNumberUnlawful,
                data: loginData.phoneNumber,
            });
        case selectUser == undefined:
            return new HttpPackage({
                code: HttpPackageCode.UserNotExis,
                data: phoneNumber,
            });
        case session.loginUserUUID != undefined:
            return new HttpPackage({
                code: HttpPackageCode.AlreadyLoginUser,
                data: phoneNumber,
            });
    }
    if (selectUser!.passwd == passwd) {
        session.loginUserUUID = selectUser!.uuid;
        return new HttpPackage({
            code: HttpPackageCode.OK,
            data: phoneNumber,
        });
    } else {
        return new HttpPackage({
            code: HttpPackageCode.LoginPasswdError,
            data: phoneNumber,
        });
    }
};

export const setup: SetupService = async function setup(app) {
    const loginPost: RequestHandler = async (req, res) => {
        const { passwd, phoneNumber } = req.body as inputLoginStruct;
        (
            await LoginUser(
                {
                    passwd: passwd,
                    phoneNumber: phoneNumber,
                    session: req.session,
                }
            )
        ).end(res);
    };
    const loginTest = ajvBodyMiddlewareStructPacker<inputLoginStruct>(() => ({
        properties: {
            phoneNumber: { type: "string" },
            passwd: { type: "string" },
        },
    }));

    const partymemberTest = ajvBodyMiddlewareStructPacker<inputSignupPartyMemberStruct>(() => ({
            properties: {
                sex: { type: "int32" },
                name: { type: "string" },
                phoneNumber: { type: "string" },
                passwd: { type: "string" },
            },
        }));

    const partymemberPost: RequestHandler = async (req, res) => {
        const bodyData = req.body as inputSignupPartyMemberStruct;
        (await SignupPartyMember(bodyData)).end(res);
    };



    installRouter(app, [
        {
            path: "/phonenumber/user",
            child: [
                {
                    path: "/signup",
                    child: [
                        {
                            path: "/partymember",
                            middleware: [parserJson()],
                            on: {
                                post: [partymemberTest,partymemberPost],
                            },
                        },
                    ],
                },
                {
                    path: "/login",
                    middleware: [parserJson()],
                    on: {
                        post: [loginTest,loginPost],
                    },
                },
            ],
        },
    ]);
};
