import WebSocket,{Server as WsServer} from "ws";
import http, { IncomingMessage } from "http";

import { loadInFolderScript } from "@src/functions/load-in-folder-script";
import { loadDBModelPath, loadWsService } from "@src/config/static.config";
import { InitError } from "@src/class/error/init-error.class";
import internal from "stream";
import R from "ramda";

declare global{
    interface SetupWsService{
        (upgrade:(callback:(client: WebSocket, request: IncomingMessage) => void)=>void,request:http.IncomingMessage,socket:internal.Duplex,head: Buffer,ws:WsServer):Promise<boolean>
    }
}


export async function initWSServer(server: http.Server, plugin: BootstrapPlugin) {

    const wsHooks:SetupWsService[]=[];

    const wsServer = new WebSocket.Server({
        noServer: true,
        perMessageDeflate: false,
    });
    const { logger } = plugin;

    await loadInFolderScript(
        loadWsService,
        async (exportObject, loadScriptPath) => {
            const exportFunc="listen";
            if (Object.prototype.hasOwnProperty.call(exportObject, exportFunc)) {
                wsHooks.push(exportObject[exportFunc] as SetupWsService);
                logger.info(`init WsService ${loadScriptPath} success`);
            } else {
                logger.error(`init WsService ${loadScriptPath} fail`);
                throw new InitError({
                    loadInterfaceName: exportFunc,
                    loadScriptPath: loadScriptPath,
                });
            }
        },
        /[\s\S]{1,}\.ws\.service\.(js|ts)$/
    );

    
    server.on("upgrade", async (request, socket, head) => {
        let _client:WebSocket;
        let _request:http.IncomingMessage;
        let _upgradeState=false;
        const upgrade=(callback:(client: WebSocket, request: IncomingMessage) => void)=>{
            if(!_upgradeState){
                _upgradeState=true;
                wsServer.handleUpgrade(
                    request,
                    socket as any,
                    head,
                    (client,request)=>{
                        _client=client;
                        _request=request;
                        callback(_client,_request)
                    }
                );
            }else{
                callback(_client,_request)
            }
        }
        for(const hookWsService of wsHooks){
            await hookWsService(upgrade,request,socket,head,wsServer);
        }
        if(!_upgradeState){
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
        
    });
}
