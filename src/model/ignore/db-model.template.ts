import { baseBuildUUID } from "@src/functions/uuid";
import { Db, MongoClient } from "mongodb";
import winston from "winston";
import { DBModelBase } from "../../class/db-model-base.abstract";
import { ErrorBase } from "../../class/error/error-base.class";
import {
    Index,
    SparseIndex,
    UniqueIndex,
    DataModel,
    DataModelApi,
} from "../../decorators/mongodb-index.decorator";
// DBModel 模板

@DataModel
export class DataModelTemplate extends DataModelApi implements DBModelBase {

    constructor(options: {
    }) {
        super();
    }

    async insert(dbConn: mongodbConn) {
        throw new Error("Not Insert Func");
        return { data: false, err: undefined };

    }

    async delete(dbConn: mongodbConn) {
        throw new Error("Not Delete Func");
        return { data: false, err: undefined };
    }

    static buildUUID(): string {
        return baseBuildUUID("geographicCMark");
    }

    static async setup(dbConn: mongodbConn) {
        return;
    }
}

// 导出初始化函数
export const setup = DataModelTemplate.setup as SetupDBModel;