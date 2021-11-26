import { InitError } from "@src/class/error/init-error.class";
import { loadRedisSubService } from "@src/config/static.config";
import { loadInFolderScript } from "@src/functions/load-in-folder-script";
import { RedisClient } from "redis";

// Redis auto setup sub function main typedef
export interface RedisSubSetup {
    (redisClient: RedisClient): void
}
// load redis sub
export async function initRedisSub(bootstrapPlugin:BootstrapPlugin): Promise<any> {
    const {redis:redisClient,logger}=bootstrapPlugin;
    await loadInFolderScript(loadRedisSubService, async (exportObject, loadScriptPath) => {
        const exportFunctionName = "setup";
        if (Object.prototype.hasOwnProperty.call(exportObject, exportFunctionName)) {
            bootstrapPlugin.logger.info(`load sub ${loadScriptPath} success`);
            ((exportObject as any)[exportFunctionName] as RedisSubSetup)(redisClient.duplicate());
        } else {
            logger.error(`init ${loadScriptPath} is not define ${exportFunctionName} function init fail`);
            throw new InitError({
                "loadScriptPath": loadScriptPath,
                "loadInterfaceName": exportFunctionName
            });
        }
    }, /[\s\S]{1,}\.sub\.(js|ts)$/);
}