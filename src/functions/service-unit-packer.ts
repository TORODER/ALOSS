import { RequestHandler, Request, Response, NextFunction, } from "express";
import ajv, { JTDSchemaType, ValidateFunction } from "ajv/dist/jtd";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
const Ajv = new ajv();

// const {a/* 服务 */,b/* 类型保护 */,c/* 服务函数版本 */} 
// = 
// f(()=>{...code},{}/* 类型保护 */,()=>/*适配器 函数|query|body */)

export type AutoAdapter = "body" | "query";
export type AutoAdapterFunc<T=any> = (request: Request) => T;
export interface ServiceUnitOptions<S=any,T=any>{
    serviceAdapter: AutoAdapter | AutoAdapterFunc<S>,
    schemaTypeAdapter: AutoAdapter | AutoAdapterFunc<T>,
    fail?: (
        req: Request,
        res: Response,
        next: NextFunction,
        test: ValidateFunction<unknown>
    ) => RequestHandler;
}
const fromBody: AutoAdapterFunc = (req) => req.body;
const fromParams: AutoAdapterFunc = (req) => req.query;
/**
 *  模版 <P,R,TP>
 * 
 *  P 表示 server 接受的参数类型
 * 
 *  R 表示 server 返回的类型 ( HttpPackage<R> )
 * 
 *  TP 表示ajv的类型声明
 * 
 *  ! 默认 P,TP 的参数都从body中读取
 *  ! 更改options参数配置获取途径
 * 
 * @param service  服务
 * @param jtdSchemaType jtd类型检查配置文件
 * @param options 选项 默认从body中获取
 * @returns 返回  服务(adapter+service) 类型保护(adapter+ajv) 服务函数版本(server)
 */
export function ServiceUnit<P,R,TP>(
    service: MiniServiceInterfaceBase<R, P>, jtdSchemaType: JTDSchemaType<TP>, options?: Partial<ServiceUnitOptions<P,TP>>,
): { service: RequestHandler, schemaType: RequestHandler, serviceRaw: MiniServiceInterfaceBase<R, P> } {
    const autoAdapter: Record<AutoAdapter, AutoAdapterFunc> = Object.assign(Object.create(null), {
        "body": fromBody,
        "query": fromParams,
    });
    const useOptions: ServiceUnitOptions<P,TP> = Object.assign(
        {
            "serviceAdapter": "body",
            "schemaTypeAdapter": "body",
        } as ServiceUnitOptions<P,TP>,
        options
    );
    const serviceAdapter = ((useOptions.serviceAdapter as AutoAdapter) in autoAdapter ? autoAdapter[useOptions.serviceAdapter as AutoAdapter] : useOptions.serviceAdapter) as AutoAdapterFunc<P>
    const schemaTypeAdapter = ((useOptions.schemaTypeAdapter as AutoAdapter) in autoAdapter ? autoAdapter[useOptions.schemaTypeAdapter as AutoAdapter] : useOptions.schemaTypeAdapter) as AutoAdapterFunc<TP>
    const testFunc=Ajv.compile(jtdSchemaType);
    return {
        "schemaType":async (req, res, next) => {
            const data=schemaTypeAdapter(req);
            if (testFunc(data)) {
                next();
            } else {
                if (options?.fail != undefined) {
                    options.fail(req as Request, res, next, testFunc);
                } else {
                    (new HttpPackage({code:HttpPackageCode.ParameterTypeTestError,data:testFunc.errors})).end(res);
                }
            }
        },
        "service":async (req,res,next)=>{
            const data=serviceAdapter(req);
            (await service(data)).end(res);
        },
        "serviceRaw":service,
    }
}
