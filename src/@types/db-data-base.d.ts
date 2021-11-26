import mongodb from "mongodb";

declare global {
    type mongodbConn = mongodb.MongoClient;
    interface DBDataBaseCallRes<T, E extends Error|undefined =Error|undefined>
        extends MulReturnTypeBase<T, E> {
        data: T;
        err: E | undefined;
    }
}
