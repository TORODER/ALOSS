export function functionPacker<F>(oldFunc:F,packer:(old:F)=>F){
    return packer(oldFunc);
}