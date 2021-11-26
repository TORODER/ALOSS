import { logRootDirPath } from "@src/config/static.config";
import path from "path";
import winston from "winston";

export function loggerBuild(options: {
    toCLI?: boolean;
    saveFileName: string;
    defaultMeta: string;
}) {
    const { toCLI: toCLI = false, saveFileName, defaultMeta } = options;
    const winstonTransport: winston.transport[] = [
        new winston.transports.File({
            filename: path.resolve(logRootDirPath, `${saveFileName}.log`),
        }),
    ];

    if (toCLI) {
        winstonTransport.push(new winston.transports.Console());
    }

    const logger = winston.createLogger({
        level: "info",
        format: winston.format.json(),
        defaultMeta: { service: defaultMeta },
        transports: winstonTransport,
    });
    return logger;
}
