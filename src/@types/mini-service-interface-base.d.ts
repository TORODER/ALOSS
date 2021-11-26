import { HttpPackage } from "../class/http-package.class";

declare global {

    // 定义最小服务方法类型 
    // 模板参数 T 为 返回类型
    // 模板参数 O 为 接收类型
    interface MiniServiceInterfaceBase<T = any,O=any> {
        (options: O): Promise<HttpPackage<T>>;
    }
}
