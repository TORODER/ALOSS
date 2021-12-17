import http from "http";
import express, { Express } from "express";

import "express-async-errors";
import { initDB } from "./bootstrap/plugin/db";
import { initLogger } from "./bootstrap/plugin/log";
import { initHttp } from "./bootstrap/http";
import { initEmailer } from "./bootstrap/plugin/email";
import { initSession } from "./bootstrap/plugin/session";
import { initWSServer } from "./bootstrap/ws";
import { initRedis } from "./bootstrap/plugin/redis";
import { initState } from "./bootstrap/plugin/state";
import { initRedisSub } from "./bootstrap/redis-sub";


let globalPluginAgg: Partial<BootstrapPlugin> = {};

// 该函数不能确保 plugin 加载完成
export function getGlobalPlugin(): BootstrapPlugin {
    return globalPluginAgg as BootstrapPlugin;
}

// main
// start function
// 这里导出是为了方便测试

// 设置 isTestMode 打开测试模式
export async function bootstrap(
    options: {
        listenPort: number;
        listenHostName: string;
        loadServicePath: string;
        isDebug: boolean;
        mongoUrl: string;
        mongoSessionPrefixName: string;
        sessionSecrets: string[];
        logRootDirPath: string;
        sessionName: string;
    },
    testOptions: {
        listen: boolean;
        useConsoleLog: boolean;
    }
): Promise<{
    app: Express;
    dbConn: mongodbConn;
}> {
    // set run mode
    if (options.isDebug) {
        process.env.NODE_ENV = "development";
    } else {
        process.env.NODE_ENV = "production";
    }
    // start init plugin
    {
        //init main logger
        const mainLogger = initLogger({
            toCLI: testOptions.useConsoleLog,
            logFileBasePath: options.logRootDirPath,
        });
        // init and connect mongodb
        const { dbConn } = await initDB(mainLogger);
        // init emailer
        const emailer = initEmailer();
        // init session
        const { handler: sessionHandler, store: sessionStore } = await initSession(options);
        // init state
        const state = await initState();
        // init redis
        const redisClient = await initRedis();
        // bootstrap load plugin over
        // mixin to global 
        globalPluginAgg = Object.assign(globalPluginAgg, {
            dbConn: dbConn,
            logger: mainLogger,
            emailer: emailer,
            sessionHandler: sessionHandler,
            sessionStore: sessionStore,
            state: state,
            redis: redisClient,
        });
    }
    const bootstrapPlugin: BootstrapPlugin = getGlobalPlugin();

    // create express
    const app = express();
    const httpServer = http.createServer(app);
    // start load service
    await initHttp(options, app, httpServer, bootstrapPlugin);
    await initWSServer(httpServer, bootstrapPlugin);
    await initRedisSub(bootstrapPlugin);
    // setup service over
    // run server
    if (testOptions.listen) {
        bootstrapPlugin.logger.info("start Run HttpServer");
        httpServer.listen(options.listenPort, options.listenHostName);
        bootstrapPlugin.logger.info("HttpServer Run Success");
        bootstrapPlugin.logger.info(`Run mode: \n\t${process.env.NODE_ENV}`);
        bootstrapPlugin.logger.info(
            `Server Host:\n\thttp: http://${options.listenHostName}:${options.listenPort}`
        );
    }
    return {
        app: app,
        dbConn: bootstrapPlugin.dbConn,
    };
}
