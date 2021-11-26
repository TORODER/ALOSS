import { MongoClient } from "mongodb";
import winston from "winston";
import {Transporter} from "nodemailer";
import SMTPTransport from "nodemailer";
import { RequestHandler } from "express";
import { RedisClient } from "redis";
import { Store as SessionStore } from "express-session";
declare global{
    interface BootstrapPlugin{
        logger:winston.Logger,
        dbConn:MongoClient,
        emailer:Transporter<SMTPTransport.SentMessageInfo>,
        sessionHandler:RequestHandler,
        sessionStore:SessionStore,
        state:State,
        redis:RedisClient
    }
}