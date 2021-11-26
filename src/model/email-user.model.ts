
import { DBModelBase } from "../class/db-model-base.abstract";
import { ErrorBase } from "../class/error/error-base.class";
import {
    UniqueIndex,
    DataModel,
    DataModelApi,
    DataModelTool,
} from "../decorators/mongodb-index.decorator";
import { transformToClass } from "@src/functions/object-transform";
import { ObjectAttrFilterNull } from "@src/functions/object-tool";
import { stringToRegexFuzzy } from "@src/functions/string-to-regex";
import { defaultHeadPortrait } from "@src/config/app.config";
import { baseBuildUUID } from "@src/functions/uuid";

export class EmailExisError extends ErrorBase {
    email: string;
    constructor(message: string, phoneNumber: string) {
        super(message);
        this.email = phoneNumber;
    }
}

export interface selectEmailUserInfoResult {
    uuid: string,
    username: string,
    email: string,
    headPortrait:string,
}

@DataModel
export class EmailUser extends DataModelApi implements DBModelBase {
    @UniqueIndex()
    uuid: string;
    @UniqueIndex()
    email: string;
    username: string;
    createTime: number;
    passwd: string;
    headPortrait: string;

    constructor(options: {
        email: string;
        passwd: string;
        username?: string;
        uuid?: string;
        createTime?: number;
        headPortrait?: string;
    }) {
        super();
        this.email = options.email;
        this.uuid = options.uuid ?? EmailUser.buildUUID();
        this.username = options.username ?? EmailUser.buildRandomUserName();
        this.createTime = options.createTime ?? Date.now();
        this.passwd = options.passwd;
        this.headPortrait = options.headPortrait ?? defaultHeadPortrait;
    }

    async insert(dbConn: mongodbConn) {
        const userCollection = this.getCollection(dbConn);
        const isEmailExis =
            (await userCollection.findOne({
                email: this.email,
            })) != undefined;
        if (isEmailExis) {
            return {
                data: undefined,
                err: new EmailExisError("该邮箱已被使用", this.email),
            };
        }
        const insertResult = await userCollection.insertOne(this);
        return { data: insertResult, err: undefined };
    }

    async delete(dbConn: mongodbConn) {
        throw new Error("Is Not Def");
        return { data: false, err: undefined };
    }

    static buildUUID(): string {
        return baseBuildUUID("useruuidEmail");
    }

    static buildRandomUserName(): string {
        return `${Math.random().toString().slice(2)}`;
    }

    /**
     *  精准搜索
     *  注意如果 传入空 options 将引发异常 
     *  请勿在不传入 options 的情况下调用本方法
     * @param dbConn db conn
     * @param filter email or uuid attr
     * @returns 返回 User 模型 (包括密码等)
     */
    static async selectOne(
        dbConn: mongodbConn,
        filter: {
            email?: string;
            uuid?: string;
        }
    ): Promise<EmailUser | undefined> {
        const filterO = ObjectAttrFilterNull({ email: filter.email, uuid: filter.uuid });
        if (Object.keys(filterO).length == 0) {
            throw Error("查询用户约束条件为空!");
        }
        const collection = DataModelTool.getCollectionFromConstructor(
            this,
            dbConn
        );
        const selectResult = (await collection.findOne(filterO)) ?? undefined;
        return transformToClass(
            this,
            selectResult
        );

    }

    /**
     * 
     * @param dbConn 
     * @param filter  
     *      email 精确
     *      username 模糊
     *      如果 filter 是空对象 则查询ALL
     * @returns 返回一个数组 (其中数据不包括密码)
     */
    static async select(dbConn: mongodbConn, filter: {
        email?: string,
        username?: string,
    }): Promise<selectEmailUserInfoResult[]> {
        const filterO = ObjectAttrFilterNull({ email: filter.email, username: filter.username });
        if (filterO.username != undefined) {
            filterO.username = { "$regex": `${stringToRegexFuzzy(filterO.username)}`, $options: "$i" };
        }
        const collection = DataModelTool.getCollectionFromConstructor<EmailUser>(this, dbConn);
        const findResult = await collection.find(filterO).project<selectEmailUserInfoResult>({
            "_id": 0,
            "passwd": 0,
        }).toArray();
        return findResult;
    }

    async update(dbConn: mongodbConn, upsert= false) {
        const collection = this.getCollection<EmailUser>(dbConn);
        await collection.baseCollection.replaceOne({ uuid: this.uuid }, this, { upsert: upsert });
    }

    static async setup(dbConn: mongodbConn) {
        const data = DataModelTool.getCollectionFromConstructor<EmailUser>(EmailUser, dbConn);
        // 修复头像为空的 User
        {
            const allUserRaw = await data.find({ headPortrait: undefined }).toArray();
            const allUser = allUserRaw.map(e => transformToClass<EmailUser>(EmailUser, e)).filter(e => e != null);
            for (const nextElem of allUser) {
                nextElem!.headPortrait = defaultHeadPortrait;
                await nextElem!.update(dbConn);
            }
        }
        return;
    }
}

// 导出初始化函数
export const setup = EmailUser.setup as SetupDBModel;