
/* 
*ApiError class extending the native Error object. This allows us to attach useful information like the HTTP statusCode and an isOperational flag (to differentiate between trusted operational errors vs unknown programming bugs).
 */

interface params {
    statusCode?: number;
    message: string,
    isOperational?: boolean;
    stack?: string;
    type?: "apiError" | "unknown"
}
export class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public type: string;
    constructor({statusCode = 500, message, isOperational = true, stack = "", type = "apiError"}: params) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            // this line sets the stack traces, on the object, this.contructer second paramenter tells to avoid this function and anything inside it from the trace
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

