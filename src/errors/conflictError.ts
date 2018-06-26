import { HttpError } from "routing-controllers";

export class ConflictError extends HttpError {

    constructor(message?: string) {
        super(409, message);
    }

}