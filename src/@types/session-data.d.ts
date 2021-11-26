import "express-session";
import { Router, Request, RequestHandler } from "express";
import { Session, SessionData } from "express-session";
import { type } from "os";
// 定义 session 携带的数据

declare global {
    type RequestSession = { session: Request["session"] };
    type RequestSessionSid = { sessionSid: string };
}

export type RequestLoginSession = {
    loginUserUUID?: string;
}

export type LoginSession={
    session:RequestLoginSession
}


declare module "express-session" {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface SessionData extends RequestLoginSession {
    }
}
