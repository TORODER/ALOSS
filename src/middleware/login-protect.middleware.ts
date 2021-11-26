import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
import { EmailUser } from "@src/model/email-user.model";
import { Request, Response, NextFunction } from "express";
import { getGlobalPlugin } from "@src/bootstrap";
const { dbConn } = getGlobalPlugin();


export async function loginProtectFunc( loginUserUUID?:string){
    switch (true) {
        case loginUserUUID == undefined:
            return new HttpPackage({
                code: HttpPackageCode.NotSignIn,
                data: "",
                describe: "没有登录",
            });
        case (await EmailUser.selectOne(dbConn, { uuid: loginUserUUID })) == undefined:
            return new HttpPackage({
                code: HttpPackageCode.UserNotExis,
                data: "",
                describe: "用户不存在",
            });
        default:
            return new HttpPackage({
                code:HttpPackageCode.OK,
                data:"",
            });
    }
}

/**
 * 确保已经登录 并且账号存在 
 * 否则返回 [HttpPackageCode.NotSignIn] or [HttpPackageCode.UserNotExis]
 */
export async function loginProtect(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const uuid = req.session.loginUserUUID;
    const resultPackage = await loginProtectFunc(uuid);
    if( resultPackage.code==HttpPackageCode.OK){
        next();
    }else{
        resultPackage.end(res);
    }
}
