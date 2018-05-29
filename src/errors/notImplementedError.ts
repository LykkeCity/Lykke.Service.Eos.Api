import { HttpError } from "routing-controllers";

export class NotImplementedError extends HttpError {

    constructor(message?: string) {
        super(501, message);
    }

}