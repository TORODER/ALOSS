import { DataModelApi } from "@src/decorators/mongodb-index.decorator";
import {
    Callback,
    Collection,
    Filter,
    FindCursor,
    FindOptions,
    OptionalId,
    UpdateFilter,
    UpdateOptions,
    UpdateResult,
    WithId,
} from "mongodb";

// * 用于代替mongodb 的 collection
export class ModelDataCollection<T extends DataModelApi> {
    baseCollection: Collection<T>;

    constructor(collection: Collection<T>) {
        this.baseCollection = collection;
    }

    find(filter: Filter<WithId<T>>, options?: FindOptions) {
        const c = this.baseCollection.find(filter, options).showRecordId(false);
        c.project({ "_id": false });
        return c as FindCursor<T>;
    }

    async findOne(filter: Filter<T>, options?: FindOptions) {
        return (await this.baseCollection.findOne(filter, {
            ...options,
            projection: {
                ...options?.projection,
                "_id": false
            }
        })) ?? undefined;
    }

    async insertOne(doc: OptionalId<T>) {
        return await this.baseCollection.insertOne(doc);
    }

    async insertMany(docs: OptionalId<T>[]) {
        return await this.baseCollection.insertMany(docs);
    }

    async deleteOne(filter: Filter<T>) {
        return await this.baseCollection.deleteOne(filter);
    }

    async updateOne(
        filter: Filter<T>,
        update: UpdateFilter<T> | Partial<T>,
        options?: UpdateOptions
    ) {
        return await this.baseCollection.updateOne(
            filter,
            update,
            options ?? {}
        );
    }
}
