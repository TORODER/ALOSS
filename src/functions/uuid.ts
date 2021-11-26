let acc=0;
export function baseBuildUUID(prefix:string){
    acc+=1;
    return `${prefix}-${Math.random().toString().slice(2)}-${Date.now()}-${acc}`;
}

