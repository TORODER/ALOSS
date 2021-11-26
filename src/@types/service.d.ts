import { TargetType } from "@src/class/ws-package.class";

export interface MessageTarget {
    targetUUID: string;
    type: TargetType;
}