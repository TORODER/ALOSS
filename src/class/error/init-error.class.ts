import { ErrorBase } from "./error-base.class";


// 初始化 动态加载模块失败
export class InitError extends ErrorBase {
    loadScriptPath:string;
    loadInterfaceFunc:string;
    constructor(options: {
        loadScriptPath: string;
        loadInterfaceName: string;
    }) {
        super(`Init Error script: ${options.loadScriptPath} interface: ${options.loadInterfaceName}`);
        this.loadScriptPath= options.loadScriptPath;
        this.loadInterfaceFunc= options.loadInterfaceName;
    }
}
