# 开始本项目

- nodejs version 14 或 更高

- 确保拥有 git bash 作为 shell 解释器

- 运行 `npm install-dep` 安装项目依赖

- 安装 `mongodb` 运行 `npm run run-db` 启动数据库

- 终端输入 `mongo --port 30000` 连接成功后输入 `rs.initiate()` 完成初始化

- 运行 `npm run debug` 启动项目

> 路径中有中文可能导致项目无法启动

- 安装环境
`shell sh ./shell/shell.sh`




# 开发原则 (仅适用于/src目录下的代码)

- 对`程序中的业务逻辑错误` 使用 golang 风格进行处理 即让出现错误的函数返回 [MulReturnTypeBase] 并进行处理
> 使用 解构来简化代码 ```javascript const {a,b} ={a:1,b:2} ```
> 这里的 `程序中的业务逻辑错误` 指的是  例如 "尝试使用已经使用的账号进行注册"  
> 这种和代码编写者无关的错误

- 对于`程序中的代码逻辑错误`例如 `user.class.ts` 文件中的 [User] 类出现错误时主动使用 `throw` 关键字抛出的异常 让程序出现错误
> 对于`js原生函数`或者`依赖库函数` 抛出的异常 在符合原则 [1] 的情况下 可以使用 `ramdajs` 中的 [tryCatch] 使用 [1] 的规范进行转换处理 

- 对于数据库`Mongodb`中的数据 应该在 `model/data` 下新建类并且继承 [DBDataBase] 之后对类进行操作而 尽量避免主动操作 `Mongodb`

- 枚举 `HttpPackageCode`中的所有值应该`显示性定义` , 程序中所有的枚举尽量全部`显示性定义`

- 对于挂载在 `express` 上的接口应该尽量 进行封装将逻辑封装在 函数中并且继承`MiniServiceInterfaceBase`接口
> 这样方便接口之间的互相调用 并且应该尽量避免将 `express` 中的变量传入 封装出的函数中

- 优先使用 `ramdajs` 中的方法 而不是手动编写工具方法
> 如果你手动编写了工具方法 请编写测试案例

# 依赖库文档
项目内使用的一些依赖库的文档

强类型语言

[typescript](https://www.typescriptlang.org/)



WebFromwork

[express](https://expressjs.com/)



数据库

[mangodb](https://mongodb.github.io/node-mongodb-native/4.0/)

[redis](https://redis.io/)

测试工具

[jestjs](https://jestjs.io/zh-Hans/docs/testing-frameworks)



WebFromwork测试工具

[supertest](https://www.npmjs.com/package/supertest)



动态类型检查工具

[ajv](https://ajv.js.org/)



json数据结构描述规范(用于`ajv`)

[jsontypedef](https://jsontypedef.com/)



手机号码验证

> (这个在项目中已经提供了包装文件,尽量避免直接使用该库,而是使用项目中的包装方法)

[google-libphonenumber](https://www.npmjs.com/package/google-libphonenumber)



函数工具方法库

> *在创建工具时优先查看该库有没有提供类似,优先使用该库

[ramdajs](https://ramdajs.com/docs/)


邮件服务

> *邮件服务 注意这里的邮件从 config/email.config.ts

[nodemailer](https://www.npmjs.com/package/nodemailer)


验证邮箱 


[email-addresses](https://www.npmjs.com/package/email-addresses)


# 许可证 (预)

本项目采用双许可证

使用者可以选择 GPL 和 BSD 二者其一来获取授权