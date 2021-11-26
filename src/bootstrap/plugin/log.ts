import winston from "winston";
import path from "path";

export function initLogger(options: {
    toCLI: boolean;
    logFileBasePath: string;
}): winston.Logger {
    const { toCLI: toCLI, logFileBasePath } = options;
    const winstonTransport: winston.transport[] = [
        new winston.transports.File({
            filename: path.resolve(logFileBasePath, `error.log`),
            level: "error",
        }),
        new winston.transports.File({
            filename: path.resolve(logFileBasePath, "all.log"),
        }),
    ];

    if (toCLI) {
        winstonTransport.push(new winston.transports.Console());
    }

    const logger = winston.createLogger({
        level: "info",
        format: winston.format.json(),
        defaultMeta: { service: "Main" },
        transports: winstonTransport,
    });
    return logger;
}
