/**
 *  一个自实现的简单断言 值为 false 时抛出
 * @param v 检测的值
 * @param throwError 失败时抛出异常
 * @returns 返回检测的值的布尔  会一直为 true
 */
export function check(v:boolean,throwError?:any):boolean{
    if(!v){
        throw (Error("Check fail")??throwError);
    }
    return v;
}