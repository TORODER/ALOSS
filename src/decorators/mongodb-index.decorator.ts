import { asAny } from "@src/functions/as-type";
import {
    CreateIndexesOptions,
    IndexDirection,
    MongoClient,
    Collection,
} from "mongodb";
import { functionPacker } from "@src/functions/function-packer";
import R from "ramda";
import { ModelDataCollection } from "@src/class/model-data-collection.class";

type DataModelApiPrototype = typeof DataModelApi.prototype

// 这是一个工具类
// 封装了 DataModel 中设计的 api
export class DataModelApi {
    getCollection<T extends DataModelApi>(dbConn: MongoClient) {
        return DataModelTool.getCollection<T>((this as unknown) as T, dbConn);
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DataModelTool {
    export function getCollectionFromConstructor<T extends DataModelApi>(f: DataModelConfig, dbConn: MongoClient) {
        const dataModelConfig = f;
        return new ModelDataCollection(dbConn
            .fromDBMap(dataModelConfig.dbMapName!)
            .collection<T>(dataModelConfig.collectionName!));
    }

    export function getCollection<T extends DataModelApi>(o: T, dbConn: MongoClient) {
        return DataModelTool.getCollectionFromConstructor<T>(
            // eslint-disable-next-line @typescript-eslint/ban-types
            (o as Object).constructor as DataModelConfig,
            dbConn
        );
    }
}

/**
 *  注入到子类构造函数对象中的配置文件
 */
export interface DataModelConfig extends Function {
    collectionName?: string;
    setup: SetupDBModel;
    dbMapName?: string;
    textIndex?: string[];
}

export function SparseIndex(
    options?: {
        unique?: boolean;
    },
    indexDir: IndexDirection = 1
) {
    return (prototype: DataModelApiPrototype, attrName: string) =>
        setupIndex(prototype, attrName, { sparse: true, ...options }, indexDir);
}

export function UniqueIndex(indexDir: IndexDirection = 1) {
    return (prototype: DataModelApiPrototype, attrName: string) =>
        setupIndex(prototype, attrName, { unique: true }, indexDir);
}

export function Index(indexDir: IndexDirection = 1) {
    return (prototype: DataModelApiPrototype, attrName: string) =>
        setupIndex(prototype, attrName, {}, indexDir);
}

export function Index2d() {
    return (prototype: DataModelApiPrototype, attrName: string) =>
        setupIndex(prototype, attrName, {}, "2d");
}

/**
 *  注意每个 mongodb 集合只能有一个 text 索引
 *  但仍可以将多个字段标记为 text index
 *  在搜索时会在这几个字段中同时搜索
 */
export function TextIndex() {
    return (prototype: DataModelApiPrototype, attrName: string) => {
        const dataModelConfig = prototype.constructor as DataModelConfig;
        if (dataModelConfig.textIndex == undefined) {
            dataModelConfig.textIndex = [attrName];
            setupIndex(prototype, dataModelConfig.textIndex!, {}, "text");
        } else {
            dataModelConfig.textIndex!.push(attrName);
        }
    };
}

/**
 * 
 * @param constructor 
 * 接收类工厂 除非是修改装饰器否则不用关心该参数
 * @param dbMapName 
 * 这个参数为 装饰器接收的第一个参数 用于设置安装到的数据库(Db) 默认安装到 main
 * 注意这里的数据库名称指的是映射在 [dbConn.fromDBMap] 方法中的名称而不是 数据库真正的名称
 * 见 bootstrap/plugin/db.ts
 */
export function DataModel(constructor: DataModelConfig, dbMapName?: string) {
    const _dbMapName = constructor.dbMapName ?? dbMapName ?? "main";
    if (constructor.collectionName == undefined) {
        constructor.collectionName = _classNameToDbNameTool(constructor.name);
    }
    constructor.dbMapName = _dbMapName;
    constructor.setup = functionPacker(
        constructor.setup,
        (oldSetup) => async (dbConn, logger) => {
            dbConn.fromDBMap(_dbMapName);
            return await oldSetup(dbConn, logger);
        }
    );
}

function _classNameToDbNameTool(name: string): string {
    return name.toLowerCase();
}



function setupIndex(
    prototype: DataModelApiPrototype,
    attrName: string | string[],
    options: CreateIndexesOptions,
    indexDir: IndexDirection
): void {
    const classPacker: DataModelConfig = prototype.constructor as any;
    if (!Object.prototype.hasOwnProperty.call(classPacker, "setup")) {
        throw Error(`model ${classPacker.name} NO setup function`);
    }
    const oldSetupFunc = classPacker.setup;
    const newSetupFunc: SetupDBModel = async (dbConn, logger) => {
        if (
            !Object.prototype.hasOwnProperty.call(classPacker, "collectionName")
        ) {
            throw Error("NO collectionName attr");
        }
        const collection = dbConn
            .fromDBMap(classPacker.dbMapName!)
            .collection(classPacker.collectionName!);
        if (R.is(Array, attrName)) {
            const attrNames = attrName as string[];
            collection.createIndex(Object.fromEntries(attrNames.map(v => [v, indexDir])), options);
        } else {
            collection.createIndex({ [attrName as string]: indexDir }, options);
        }
        return await oldSetupFunc(dbConn, logger);
    };
    classPacker.setup = newSetupFunc;
}
