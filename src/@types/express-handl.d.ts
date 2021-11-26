import { NextFunction ,Request,Response} from "express";

declare global{
    type ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => any;
}
