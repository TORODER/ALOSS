// eslint-disable-next-line @typescript-eslint/ban-types
export function transformToClass<T>(target:Function,transformObject:Record<string,any>|undefined|undefined):T|undefined{
    if(transformObject!=undefined){
        return Object.setPrototypeOf(transformObject,target.prototype) as T;
    }else{
        return undefined;
    }
}