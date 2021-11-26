import { InitError } from "@src/class/error/init-error.class";
import { loadInFolderScript } from "@src/functions/load-in-folder-script";
import Express from "express";
import http from "http";
import { loggerBuild } from "@src/functions/logger-build";
import compression from "compression";
import { RunServerConfig } from "@src/config/static.config";
export async function initHttp(
    options: RunServerConfig,
    app: Express.Express,
    httpServer: http.Server,
    bootstrapPlugin: BootstrapPlugin
): Promise<void> {
    const {
        dbConn,
        logger: mainLogger,
        emailer,
        sessionHandler,
    } = bootstrapPlugin;
    const { loadServicePath } = options;
    //delete 'express' char in header
    app.disable("x-powered-by");
    //setup accept Request Logger  middleware

    //setup dep
    {
        //gzip
        app.use(compression());
        //session
        app.use(sessionHandler);
    }
    // setup accept log
    {
        const acceptRequestLogger = loggerBuild({
            toCLI: false,
            saveFileName: "accept-request",
            defaultMeta: "accept-request-log",
        });
        app.use((req, res, next) => {
            acceptRequestLogger.info({
                url: req.url,
                date: Date(),
                ips: req.ips.join(","),
                type: req.method,
            });
            next();
        });
    }

    // load .service
    await loadInFolderScript(
        loadServicePath,
        async (exportObject, loadScriptPath) => {
            if (Object.prototype.hasOwnProperty.call(exportObject, "setup")) {
                // call service setup function
                await (exportObject["setup"] as SetupService)(
                    app,
                    bootstrapPlugin,
                    app
                );
                mainLogger.info(`load service ${loadScriptPath} success`);
                return {
                    pluginPath: loadScriptPath,
                    loadState: "success",
                };
            } else {
                mainLogger.error(
                    `${loadScriptPath} setup error no find setup func`
                );
                throw new InitError({
                    loadInterfaceName: "setup",
                    loadScriptPath: loadScriptPath,
                });
            }
        },
        /[\s\S]{1,}\.service\.(js|ts)$/
    );

    // 错误捕捉器
    const errHandle: ErrorRequestHandler = (err, req, res, next) => {
        if (err != undefined) {
            mainLogger.error([err.toString(), (err as Error).stack]);
            res.status(500).send(err.toString()).end();
        } else {
            next();
        }
    };
    app.use(errHandle);

    // setup 404
    app.use((req, res) => {
        mainLogger.error(`404 Url:${req.url} Method:${req.method}`);
        res.status(404).send("Sorry cant find that!");
    });
}
