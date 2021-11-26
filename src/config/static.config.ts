import path from "path";

export const serverRootPath = path.resolve(__dirname,"../");
export const listenPort = 9091;
export const listenHostName = "0.0.0.0";
export const isDebug = true;
export const mongoUrl = "mongodb://127.0.0.1:30000";
export const redisHost = "127.0.0.1";
export const redisPort = 30002;
export const logRootDirPath = path.resolve("./log");

export const sessionName="sessionvalue";
export const mainDBName="_aloss";



// auto load path
export const loadDBModelPath=path.resolve(serverRootPath,"model");
export const loadServicePath = path.resolve(serverRootPath,"service");
export const loadWsService = path.resolve(serverRootPath,"ws");
export const loadRedisSubService = path.resolve(serverRootPath,"pubsub","sub");


export const runServerConfig = {
    listenPort: listenPort,
    listenHostName: listenHostName,
    loadServicePath: loadServicePath,
    isDebug: isDebug,
    mongoUrl: mongoUrl,
    mongoSessionPrefixName: "_aloss_session:",
    sessionSecrets: [`xA):"^3#0Sx@8s5!va$1":qda7sd[';x1i`],
    logRootDirPath: logRootDirPath,
    sessionName:sessionName
};

export type RunServerConfig=typeof runServerConfig;

export const runServerTestOptions = {
    useConsoleLog: true,
    listen: true,
};
