import path from "path";
import fs from "fs";
export async function loadInFolderScript<T = unknown>(
    loadScriptPath: string,
    loader: (exportObject: Record<string, unknown>,loadScriptPath:string) => Promise<T>,
    testScriptRegExp=/[\s\S]{1,}\.(js)|(ts)$/,
): Promise<T[]> {
    loadScriptPath = path.resolve(loadScriptPath);
    //scan load service
    const pluginDirFileList = fs.readdirSync(loadScriptPath);
    const readJsModuleFile = pluginDirFileList
        .map((v) => path.resolve(`${loadScriptPath}/${v}`))
        .filter((v) => {
            const rfstate = fs.statSync(v);
            return rfstate.isFile() && testScriptRegExp.test(v);
        });

    //setup service to express
    return await Promise.all(
        readJsModuleFile.map((v) => {
            return (async (v) => {
                const loadPlugin = await import(v);
                return await loader(loadPlugin,v);
            })(v);
        })
    );
}
