
import { DBModelBase } from "../class/db-model-base.abstract";
import { ErrorBase } from "../class/error/error-base.class";
import {
    UniqueIndex,
    DataModel,
    DataModelApi,
    DataModelTool,
    Index2d,
} from "../decorators/mongodb-index.decorator";

import { baseBuildUUID } from "@src/functions/uuid";
import { md5 } from "@src/functions/crypto-hash";


/**
 * Geographic coordinate mark base
 * 基础信息
 */
export interface GeographicCMarkBase {
    // * 经纬度
    location: LongitudeLatitude,
    // * 名称
    name: string,
    // * 国家
    country: string,
    // * 城市
    city?: string,
    // * 省份
    province?: string,
    // * 地区
    district?: string,
    // * 乡镇
    township?: string,
    // * 街道
    street?: string,
    // * 详细地址
    address?: string,
}


@DataModel
export class GeographicCoordinateMark extends DataModelApi implements DBModelBase, GeographicCMarkBase {

    @UniqueIndex()
    uuid: string;

    // * 经纬度
    @Index2d()
    location: LongitudeLatitude;

    // * 名称
    name: string;

    // * 国家
    country: string;

    // * 防止数据条目重复
    @UniqueIndex()
    hashid: string

    // * 城市
    city?: string;

    // * 省份
    province?: string;

    // * 地区
    district?: string;

    // * 乡镇
    township?: string;

    // * 街道
    street?: string;

    // * 详细地址
    address?: string


    constructor(options: {
        uuid?: string,
        // * 经纬度
        location: LongitudeLatitude,
        // * 名称
        name: string,
        // * 国家
        country: string,
        // * 城市
        city?: string,
        // * 省份
        province?: string,
        // * 地区
        district?: string,
        // * 乡镇
        township?: string,
        // * 街道
        street?: string,
        // * 详细地址
        address?: string,
    }) {
        super();
        this.uuid = options.uuid ?? GeographicCoordinateMark.buildUUID();
        this.location = options.location;
        this.name = options.name;
        this.country = options.country;
        this.city = options.city;
        this.province = options.province;
        this.district = options.district;
        this.township = options.township;
        this.street = options.street;
        this.address = options.address;
        this.hashid = `${md5(JSON.stringify(options))}-${this.location[0]},${this.location[1]}`;
    }

    async insert(dbConn: mongodbConn) {
        const insertResult = await this.getCollection(dbConn).insertOne(this);
        return { data: insertResult, err: undefined };
    }

    async delete(dbConn: mongodbConn) {
        throw new Error("Not Delete Func");
        return { data: false, err: undefined };
    }

    toFormatString(): string {
        return [this.country, this.province, this.city, this.district, this.street, this.address, this.name].filter(e => e != undefined).join('');
    }

    toGeographicCMarkBase(): GeographicCMarkBase {
        return {
            location: this.location,
            name: this.name,
            country: this.country,
            city: this.city,
            province: this.province,
            district: this.district,
            township: this.township,
            street: this.street,
            address: this.address
        };
    }



    static async insertMany(dbconn: mongodbConn, geographicCoordinateMarks: GeographicCoordinateMark[]) {
        for (const nextMark of geographicCoordinateMarks) {
            try {
                await nextMark.insert(dbconn);
            } catch (e) {
                "";
            }
        }
        return {
            data: undefined,
            err: undefined
        };
    }

    static buildUUID(): string {
        return baseBuildUUID("geographicCMark");
    }

    static async setup(dbConn: mongodbConn) {
        return;
    }
}

// 导出初始化函数
export const setup = GeographicCoordinateMark.setup as SetupDBModel;