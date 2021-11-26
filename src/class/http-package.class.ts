import { Response } from "express";
export enum HttpPackageCode {
    // 所有正确的请求都返回 2000
    OK = 2000,
    // 常规错误
    GeneralError = 4000,
    // 注册手机号已经被使用
    SignUpErrorPhoneNumberIsExis = 4001,
    // 手机号不合规
    ErrorPhoneNumberUnlawful = 4002,
    // 登陆时密码错误
    LoginPasswdError = 4003,
    // 过于类似 404 故保留状态码 不使用
    _NOCODE = 4004,
    // 账号不存在
    UserNotExis = 4005,
    // 已经登录账号
    AlreadyLoginUser = 4006,
    // 邮箱验证码错误 Email TestCode Error
    EmailTestCodeError = 4007,
    // 邮箱验证码不存在
    EmailTestCodeIsNotExis = 4008,
    // 邮箱验证码过期
    EmailTestCodeTimeOut = 4009,
    // 邮箱已经被注册
    SignUpErrorEmailIsExis = 4010,
    // 账号没有登入
    NotSignIn = 4011,
    // 参数类型验证失败
    ParameterTypeTestError = 4012,
    // 参数检测错误
    ParameterTestError = 4013,
    // message target 不存在
    MessageTargetNoExis = 4014,
    // UUID (GROUP OR USER) 不存在
    UUIDIsNotExis=4015,
    // 目标用户没有登录
    TargetUserNoTSignIn=4016,
}

export class HttpPackage<T> {
    code: HttpPackageCode;
    data: T;
    describe?: string;
    constructor(options: {
        code: HttpPackageCode;
        data: T;
        describe?: string;
    }) {
        this.code = options.code;
        this.data = options.data;
        this.describe = options.describe ?? "无说明";
    }
    end(
        response: Response<unknown, any>,
        options?: {
            httpStatus: number;
        }
    ): void {
        response
            .status(options?.httpStatus ?? 200)
            .json(this)
            .end();
    }
}
