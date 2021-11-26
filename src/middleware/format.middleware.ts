import { parseEmail } from "@src/functions/parse-email-tool";
import { NextFunction, Request, RequestHandler, Response } from "express";

interface inFormat<T>{
    (req:Request):T
}


interface outFormat<T>{
    (req:Request,value:T):void
}


/**
 * 
 * @param inFormat 获取 Request 的Email
 * @param outFormat 将转换完成后的Email设置到 Request 中
 * @returns 一个包装完成的中间件
 */
export function formatEmailAttr(inFormat:inFormat<string>,outFormat:outFormat<string>):RequestHandler{
    return (req,res,next)=>{
        const emailValue=inFormat(req);
        const result=parseEmail(emailValue);
        if(result==undefined){
            throw Error("解析Email失败 请在此前添加 Email 字段检查");
        }
        outFormat(req,result!);
        next();
    };
}