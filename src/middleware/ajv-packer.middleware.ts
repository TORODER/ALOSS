import { ValidateFunction } from "ajv/dist/jtd";
import { NextFunction, Request, RequestHandler, Response } from "express";
import ajv, { JTDSchemaType } from "ajv/dist/jtd";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
const Ajv = new ajv();

type ajvBodyMiddlewarePacker = (
    test: () => ValidateFunction,
    options?: {
        fail?: (
            req: Request,
            res: Response,
            next: NextFunction,
            test: ValidateFunction<unknown>
        ) => RequestHandler;
    },
    getRawData?:"body"|"query"
) => RequestHandler;
export const ajvBodyMiddlewarePacker: ajvBodyMiddlewarePacker = (
    buildTest,
    options,
    getRawData
) => {
    const test = buildTest();
    return (req, res, next) => {
        if (test(req[getRawData??"body"])) {
            next();
        } else {
            if (options?.fail != undefined) {
                options.fail(req as Request, res, next, test);
            } else {
                (new HttpPackage({code:HttpPackageCode.ParameterTypeTestError,data:test.errors})).end(res);
            }
        }
    };
};

type ajvBodyMiddlewareStructPacker = <T>(
    test: () => JTDSchemaType<T>,
    options?: {
        fail?: (
            req: Request,
            res: Response,
            next: NextFunction,
            test: ValidateFunction<unknown>
        ) => RequestHandler;
    },
    getRawData?:"body"|"query"
) => RequestHandler;
export const ajvBodyMiddlewareStructPacker: ajvBodyMiddlewareStructPacker = (
    buildTest,
    options,
    getRawData
) => {
    const testStruct = buildTest();
    const createTest = Ajv.compile(testStruct);
    return (req, res, next) => {
        if (createTest(req[getRawData??"body"])) {
            next();
        } else {
            if (options?.fail != undefined) {
                options.fail(req as Request, res, next, createTest);
            } else {
                (new HttpPackage({code:HttpPackageCode.ParameterTypeTestError,data:createTest.errors})).end(res);
            }
        }
    };
};
