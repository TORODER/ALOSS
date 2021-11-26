export enum TargetType {
    SINGLE = "single",
    GROUP = "group",
}

export enum WsPackageCode{
    pushChatMessage=1001,
    pushEndSeeMessageDate=1002,
    loginFromAnother=1003,
    pushForwarding=1004,
}


export class WsPackage{
    code:WsPackageCode
    data:Record<string,any>|string
    constructor(code:WsPackageCode,data:Record<string,any>|string){
        this.code=code;
        this.data=data;
    }
    /**
     * 将数据JSON化为字符串
     * @returns JSON String
     */
    toString(){
        return JSON.stringify(this);
    }
}

export interface WsPushEndSeeMessageDate{
    targetUUID:string,
    endSeeDate:number,
    noSeeMessageCount:number,
    type:TargetType
}