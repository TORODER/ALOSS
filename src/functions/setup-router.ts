import {RequestHandler,Express, Router} from  "express";
import express,{RouterOptions} from  "express";
import { asAny } from "./as-type";
import R from "ramda";

export interface RouterCallConfig{
    all    ?:RequestHandler[]|RequestHandler,
    get    ?:RequestHandler[]|RequestHandler,
    post   ?:RequestHandler[]|RequestHandler,
    put    ?:RequestHandler[]|RequestHandler,
    delete ?:RequestHandler[]|RequestHandler,
    patch  ?:RequestHandler[]|RequestHandler,
    options?:RequestHandler[]|RequestHandler,
    head   ?:RequestHandler[]|RequestHandler,
}

export interface RouterConfig {
    path:string,
    middleware?:Array<RequestHandler>,
    child?:Array<RouterConfig>
    on?:RouterCallConfig,
    static?:string,
    config?:RouterOptions
}

export function installRouter(router:Router,routerConfig:RouterConfig[]):void{
    routerConfig.forEach((config)=>installOneRouter(router,config));
}

export function installOneRouter(_router:Router,routerConfig:RouterConfig):void{
    const mountRouter=Router(Object.assign({mergeParams:true} as RouterOptions,routerConfig.config??{}));
    // mount to root
    _router.use(routerConfig.path,mountRouter);
    // mount middleware
    routerConfig.middleware?.forEach(m=>mountRouter.use(m));
    // mount on
    if(routerConfig.on!=undefined){
        const callKeyNames=Object.keys(routerConfig.on);
        callKeyNames.forEach(callKeyName=>{
            if( asAny(mountRouter)[callKeyName]!=undefined){
                const getCall=asAny(routerConfig).on[callKeyName];
                if(R.is(Array,getCall)){
                    asAny(mountRouter)[callKeyName]("/",...getCall);
                }else{
                    asAny(mountRouter)[callKeyName]("/",getCall);
                }
            }
        });
    }
    // static
    if(routerConfig.static!=undefined){
        mountRouter.use(express.static(routerConfig.static));
    }
    // child 
    if(routerConfig.child!=undefined){
        installRouter(mountRouter,routerConfig.child);
    }
}