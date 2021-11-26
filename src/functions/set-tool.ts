export function setTwoDiff<T=any>(a:Set<T>,b:Set<T>):Set<T>{
    const result=new Set<T>();
    a.forEach(v=>{
        (!b.has(v))?result.add(v):undefined;
    });
    b.forEach(v=>{
        (!a.has(v))?result.add(v):undefined;
    })
    return result;
}