import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
import {
    RequestHandler,
    Request,
    ParamsDictionary,
    Response,
} from "express-serve-static-core";
import QueryString from "qs";
import { VerifiTestCode } from "@src/service/test-code.service";
import { parseEmail } from "@src/functions/parse-email-tool";
import { EmailUser } from "@src/model/email-user.model";
import { getGlobalPlugin } from "@src/bootstrap";
import { setTwoDiff } from "@src/functions/set-tool";
import { MessageTarget } from "@src/@types/service";
import { MessageTargetIsExis } from "@src/service/forwarding.service";
import { TargetType } from "@src/class/ws-package.class";

const { dbConn, logger, emailer } = getGlobalPlugin();


type buildErrorPacker = (
    res: Response<any, Record<string, any>, number>,
    key: string,
    value: any,
    attrMap: Record<string, (v: any) => Promise<boolean>>
) => void;

/**
 *
 * @param attrMap
 * 属性验证器根据 key 调用指定的验证函数 验证  [testDataBuilder] 生成的Map中的数据正确性  true 则成功  false 则失败
 * @param testDataBuilder
 * 测试数据生成器 可以获取  Request 参数 从 Request 中提取
 * @param _buildErrorPack
 * 设置发生错误时的生成函数 默认会发送 为[ParameterTestError] 的 HttpPack
 * @returns
 */
export function attrTestMiddlewareBuilder(
    attrMap: Record<string, (v: any) => Promise<boolean>>,
    testDataBuilder: (req: Request) => Record<string, any>,
    _buildErrorPack?: buildErrorPacker
): RequestHandler {
    const buildErrorPack =
        _buildErrorPack ??
        ((res, k: string, v: any, attrMap) =>
            new HttpPackage({
                code: HttpPackageCode.ParameterTestError,
                data: `Error ${k} test fail val is ${v}`,
            }).end(res));
    return async (req, res, next) => {
        const testMap = testDataBuilder(req);
        for (const nextKey of Object.keys(testMap)) {
            if (!(await attrMap[nextKey](testMap[nextKey]))) {
                return buildErrorPack(res, nextKey, testMap[nextKey], attrMap);
            }
        }
        next();
    };
}
type getEmailFunction = (
    req: Request<
        ParamsDictionary,
        any,
        any,
        QueryString.ParsedQs,
        Record<string, any>
    >
) => { email: string };

/**
 *
 * @param getEmailFunc
 *  获取email的函数
 * @returns
 *  如果失败则 根据 [VerifiTestCode] 返回值 为 [ParameterTestError] 的 HttpPack
 */
export function emailAttrTest(getEmailFunc: getEmailFunction) {
    return attrTestMiddlewareBuilder(
        {
            email: async (v) => (parseEmail(v) != undefined ? true : false),
        },
        (req) => {
            const email = getEmailFunc(req);
            return { email };
        }
    );
}

type getTestCodeFunction = (
    req: Request<
        ParamsDictionary,
        any,
        any,
        QueryString.ParsedQs,
        Record<string, any>
    >
) => { email: string; testCode: string };

/**
 *
 * @param getTestCodeFunc
 *  获取 email 和 testCode 的函数
 * @param autoDelete
 *  在检测成功后从数据库删除 TestCode
 * @returns
 *  如果成功则 next
 *  如果失败则 根据 [VerifiTestCode] 返回值 为 [ParameterTestError] 的 HttpPack
 */
export function testCodeAttrTest(
    getTestCodeFunc: getTestCodeFunction,
    autoDelete = true
): RequestHandler {
    return async (req, res, next) => {
        const testData = getTestCodeFunc(req);
        const verifiResult = await VerifiTestCode({ ...testData, autoDelete });
        if (verifiResult.code != HttpPackageCode.OK) {
            verifiResult.end(res);
        } else {
            next();
        }
    };
}


export function testMessageTargetIsExis(getMessageStruct: (request: Request) => MessageTarget): RequestHandler {
    return async (req, res, next) => {
        const testData = getMessageStruct(req);
        const result = await MessageTargetIsExis(testData);
        if (result.code != HttpPackageCode.OK) {
            result.end(res);
        } else {
            next();
        }
    };
}

/**
 * 
 * @param getTestUUID 接受一个函数从Request 中解析得到UUID列表  
 * @returns 判断得到的列表中的UUID是否存在
 */
export function testUUIDTargetIsExis(getTestUUID: (request: Request) => { uuids: string[], chatMessageType: TargetType }): RequestHandler {
    return async (req, res, next) => {
        const getData = getTestUUID(req);
        const uuidSet = new Set(getData.uuids);
        const findSet = new Set<string>();
        for (const nextUUID of uuidSet) {
            let selectInfo;
            if (getData.chatMessageType == TargetType.GROUP) {
                // TODO Group 实现
            } else {
                selectInfo = await EmailUser.selectOne(dbConn, { uuid: nextUUID });
            }
            if (selectInfo != undefined) {
                findSet.add(nextUUID);
            }
        }
        const diff = [...setTwoDiff(findSet, uuidSet)];
        if (diff.length == 0) {
            next();
        } else {
            (new HttpPackage({ code: HttpPackageCode.UUIDIsNotExis, data: diff })).end(res);
        }
    }

}