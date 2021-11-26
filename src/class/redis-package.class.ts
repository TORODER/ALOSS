
export interface RedisMessagePackage<T> {
    code: number,
    data: T,
}



export function StringToRedisMessagePackage<T>(rawData: string): RedisMessagePackage<T> {
    return JSON.parse(rawData) as RedisMessagePackage<T>;
}


export function RedisMessagePackageToString(o: RedisMessagePackage<unknown>): string {
    return JSON.stringify(o);
}