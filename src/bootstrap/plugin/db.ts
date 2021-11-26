import { Db, MongoClient } from "mongodb";
import { mongoUrl, loadDBModelPath, mainDBName } from "../../config/static.config";
import { loadInFolderScript } from "../../functions/load-in-folder-script";
import winston from "winston";
import { InitError } from "../../class/error/init-error.class";


const dbUrl = `${mongoUrl}`;

// setup [getDBMap] to mongodb object
function fromDBMap(this: MongoClient, dbMapName: string) {
    const mainDB = this.db(mainDBName);
    const dbMap = {
        // Db 映射表
        _rawDB: {
            main: mainDB,
        },
    };
    // 调用该函数一般都为硬编码
    // 如果尝试获取的数据库不存在时 一般 认为 是代码出现问题 所以直接抛出异常
    // 如果确实有需求 可以使用 try 表达式 or ramdajs的tryCatch 尝试捕捉异常 
    if (Object.prototype.hasOwnProperty.call(dbMap._rawDB, dbMapName)) {
        return (dbMap._rawDB as any)[dbMapName] as Db;
    }else{
        throw Error(`db ${dbMapName} is not exis !`);
    }
}

type fromDBMap = typeof fromDBMap;
declare module "mongodb" {
    interface MongoClient {
        fromDBMap: fromDBMap;
    }
}
MongoClient.prototype.fromDBMap = fromDBMap;

export const initDB = async (logger: winston.Logger) => {
    const mongodbClient = new MongoClient(dbUrl);
    await mongodbClient.connect();
    // load dbModel
    await loadInFolderScript(
        loadDBModelPath,
        async (exportObject, loadScriptPath) => {
            if (Object.prototype.hasOwnProperty.call(exportObject, "setup")) {
                await (exportObject["setup"] as SetupDBModel)(
                    mongodbClient,
                    logger
                );
                logger.info(`init dbModel ${loadScriptPath} success`);
            } else {
                logger.error(`init dbModel ${loadScriptPath} fail`);
                throw new InitError({
                    loadInterfaceName: "setup",
                    loadScriptPath: loadScriptPath,
                });
            }
        },
        /[\s\S]{1,}\.model\.(js|ts)$/
    );

    return {
        dbConn: mongodbClient,
    };
};
