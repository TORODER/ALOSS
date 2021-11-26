import { transformToClass } from "./object-transform";
// 工具方法
// object attr 类型检测工具 当包含所有要求的参数时返回 true 否则 false
export function objectAttrTest(
    o: Record<string, unknown>,
    attrs: string[]
): boolean {
    for (const nextAttr of attrs) {
        if (!Object.prototype.hasOwnProperty.call(o, nextAttr)) {
            return false;
        }
    }
    return true;
}

export const objectAttrFilter = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    o: Object,
    filter: (k: string, v: any) => boolean
) =>
    transformToClass(
        o.constructor,
        Object.fromEntries(Object.entries(o).filter((v) => filter(v[0], v[1])))
    );

// eslint-disable-next-line @typescript-eslint/ban-types
export const ObjectAttrFilterNull = (o: Object) =>
    objectAttrFilter(o, (k, v) => v != undefined && v != undefined) as Record<
        string,
        any
    >;
