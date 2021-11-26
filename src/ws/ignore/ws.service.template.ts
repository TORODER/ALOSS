import { getGlobalPlugin } from "@src/bootstrap";
import { HttpPackageCode } from "@src/class/http-package.class";
import { loginProtectFunc } from "@src/middleware/login-protect.middleware";
import { Request } from "express";
const { sessionHandler, logger } = getGlobalPlugin();

export const listen: SetupWsService = async (upgrade,request, socket, head, ws) => {

    upgrade(async (client,request)=>{
        const sessionTest = await new Promise<boolean>((res) => {
            sessionHandler(request as any, {} as any, async () => {
                const requestExpress = request as unknown as Request;
                if (
                    (await loginProtectFunc(requestExpress.session.loginUserUUID))
                        .code == HttpPackageCode.OK
                ) {
                    res(true);
                } else {
                    res(false);
                }
            });
        });
        // client.send("hello~");
    });

    return true;
};
