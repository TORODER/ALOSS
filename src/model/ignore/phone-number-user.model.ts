import winston from "winston";
import {
    formatPhoneNumberToString,
    testPhoneNumberCNPhoneNumber,
} from "../../functions/phone-number-tool";
import { ErrorBase } from "../../class/error/error-base.class";
import { DBModelBase } from "../../class/db-model-base.abstract";
import {
    DataModel,
    DataModelConfig,
    DataModelApi,
    Index,
    UniqueIndex,
    DataModelTool,
} from "../../decorators/mongodb-index.decorator";
import { Db } from "mongodb";
import { transformToClass } from "@src/functions/object-transform";

export enum UserType {
    admin = 0,
    communistMember = 1,
    generalPublic = 2,
}

export enum Sex {
    man = 0,
    woman = 1,
}

class PhoneNumberError extends ErrorBase {
    constructor(m: string) {
        super(m);
    }
}

export class PhoneNumberExisError extends ErrorBase {
    phoneNumber: string;
    constructor(message: string, phoneNumber: string) {
        super(message);
        this.phoneNumber = phoneNumber;
    }
}

// 用户账号的数据模型
@DataModel
export class PhoneNumberUser<T extends ProprietaryData>
    extends DataModelApi
    implements DBModelBase
{
    static async setup(dbConn: mongodbConn): Promise<void> {
        return;
    }

    // 唯一的标识ID
    @UniqueIndex()
    uuid: string;
    // 用户类型 和 [T] 有关可以用来判断 typeData 的类型
    userType: UserType;
    // ProprietaryData 的类型
    typeData: T;
    // 用户创建时的Unix时间戳
    @Index(-1)
    createTimeToken: number;
    // 用户名
    username: string;
    // 性别
    sex: Sex;
    // 电话号 ( 重要的索引 )
    @UniqueIndex()
    phoneNumber: string;
    passwd: string;
    constructor(options: {
        uuid?: string;
        userType: UserType;
        typeProprietary: T;
        username: string;
        sex: Sex;
        createTimeToken?: number;
        phoneNumber: libphonenumber.PhoneNumber;
        passwd: string;
    }) {
        super();
        if (!testPhoneNumberCNPhoneNumber(options.phoneNumber))
            throw new PhoneNumberError("Phone Number Error");
        this.uuid = options.uuid ?? PhoneNumberUser.buildUUID();
        this.userType = options.userType;
        this.typeData = options.typeProprietary;
        this.createTimeToken = options.createTimeToken ?? Date.now();
        this.username = options.username;
        this.sex = options.sex;
        this.phoneNumber = formatPhoneNumberToString(options.phoneNumber);
        this.passwd = options.passwd;
    }

    async delete(
        dbConn: mongodbConn
    ): Promise<DBDataBaseCallRes<boolean, Error>> {
        throw Error("No Define delete");
    }

    async insert(
        dbConn: mongodbConn
    ): Promise<DBDataBaseCallRes<boolean, Error>> {
        const userCollection = this.getCollection(dbConn);
        const isPhoneExis =
            (await userCollection.findOne({
                phoneNumber: this.phoneNumber,
            })) != undefined;
        if (isPhoneExis) {
            return {
                data: false,
                err: new PhoneNumberExisError(
                    "该手机号已经被注册",
                    this.phoneNumber
                ),
            };
        }
        await userCollection.insertOne(this);
        return { data: true, err: undefined };
    }

    static buildUUID(): string {
        return `useruuid-${Math.random().toString().slice(2)}-${Date.now()}`;
    }

    static async select(
        filter: { phoneNumber: string },
        dbConn: mongodbConn
    ): Promise<PhoneNumberUser<ProprietaryData> | undefined | undefined> {
        const { phoneNumber } = filter;
        const getData=(await DataModelTool.getCollectionFromConstructor<PhoneNumberUser<ProprietaryData>>(this, dbConn).findOne({ phoneNumber: phoneNumber }))??undefined;
        return transformToClass(this,getData);
    }
}

// 特有数据的基类
export class ProprietaryData {}

export class CommunistMemberData extends ProprietaryData {}

// 导出初始化函数
export const setup = PhoneNumberUser.setup as SetupDBModel;
