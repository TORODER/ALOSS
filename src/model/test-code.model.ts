import { testCodeLength, testCodeTimeOut } from "@src/config/app.config";
import {
    DataModel,
    DataModelApi,
    DataModelTool,
    UniqueIndex,
} from "@src/decorators/mongodb-index.decorator";
import { transformToClass } from "@src/functions/object-transform";
import { DBModelBase } from "../class/db-model-base.abstract";
// TestCode 模板
@DataModel
export class TestCode extends DataModelApi implements DBModelBase {
    @UniqueIndex()
    email: string;
    testCode: string;
    createTime: number;
    constructor(options: { email: string; testCode?: string }) {
        super();
        this.email = options.email;
        this.testCode = options.testCode ?? TestCode.buildTestCode();
        this.createTime = Date.now();
    }

    static async setup(dbConn: mongodbConn) {
        return;
    }

    async insert(dbConn: mongodbConn) {
        const collection = await this.getCollection<TestCode>(dbConn);
        await collection.updateOne(
            { email: this.email },
            { $set: { testCode: this.testCode } },
            { upsert: true }
        );
        return { data: undefined, err: undefined };
    }
    async delete(dbConn: mongodbConn) {
        const deleteRes = await this.getCollection(dbConn).deleteOne(this);
        return { data: deleteRes, err: undefined };
    }

    isTimeOut() {
        return this.createTime + testCodeTimeOut < Date.now();
    }

    static async select(
        dbConn: mongodbConn,
        filter: { email: string }
    ): Promise<TestCode | undefined | undefined> {
        const testCodeCollection =
            DataModelTool.getCollectionFromConstructor<TestCode>(
                TestCode,
                dbConn
            );
        const findData =
            (await testCodeCollection.findOne({
                email: filter.email,
            })) ?? undefined;
        return transformToClass(this, findData);
    }

    static buildTestCode() {
        return Math.random().toString().slice(2).slice(0, testCodeLength);
    }
}

// 导出初始化函数
export const setup = TestCode.setup as SetupDBModel;
