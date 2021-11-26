import { getGlobalPlugin } from "@src/bootstrap";
import { ConnectionPoolMonitoringEvent } from "mongodb";
import WebSocket from "ws";
import { WsPackage, WsPackageCode, WsPushEndSeeMessageDate } from "./ws-package.class";


const globalPlugin = getGlobalPlugin();

enum UserClientConnState {
    conn,
    close
}

export class UserClientConn {
    rawConn: WebSocket
    // * sessionID
    sid: string;
    connClose: UserClientConnState;

    constructor(conn: WebSocket, sid: string) {
        this.rawConn = conn;
        this.sid = sid;
        this.initConn(conn);
        this.connClose = UserClientConnState.conn;
    }

    private initConn(conn: WebSocket) {
        conn.addListener("close", (code, message) => {
            this.connClose = UserClientConnState.close;
        });
    }

    // 推送聊天消息
    sendPushChatMessage(dataObj: Record<string, any>) {
        const pushPackage = new WsPackage(WsPackageCode.pushChatMessage, dataObj);
        this.rawConn.send(pushPackage.toString());
    }

    // 发送最后查看时间
    sendPushEndSeeMessageDate(dataObj: WsPushEndSeeMessageDate) {
        const pushPackage = new WsPackage(WsPackageCode.pushEndSeeMessageDate, dataObj);
        this.rawConn.send(pushPackage.toString());
    }

    // 发送在其他地方登录通知
    async sendLoginFromAnother() {
        const pushPackage = new WsPackage(WsPackageCode.loginFromAnother, {});
        await new Promise(res => this.rawConn.send(pushPackage.toString(), res));
    }

    // 发送转发数据
    sendForwarding(forwardingData: string) {
        const pushPackage = new WsPackage(WsPackageCode.pushForwarding, forwardingData);
        this.rawConn.send(pushPackage.toString());
    }

    close() {
        this.rawConn.close();
    }


}