import { Express, Router } from "express";
import { Db, MongoClient } from "mongodb";
import winston from "winston";

declare global {
    // 服务模块(Service)  暴露出去 setup 方法的函数签名
    interface SetupService {
        (app: Router, plugin:BootstrapPlugin,expressServer:Express):  Promise<void>;
    }

    // 数据库对象(Service)  暴露出去 setup 方法的函数签名
    interface SetupDBModel {
        (dbConn: MongoClient, logger: winston.Logger): Promise<void> ;
    }
}
