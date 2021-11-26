import { Db, MongoClient } from "mongodb";

export abstract class DBModelBase   {
    insert(
        conn: MongoClient,
        options: unknown
    ): Promise<DBDataBaseCallRes<unknown>> {
        throw new Error("No Def");
    }
    delete(
        conn: MongoClient,
        options: unknown
    ): Promise<DBDataBaseCallRes<unknown>> {
        throw new Error("No Def");
    }
    
}
