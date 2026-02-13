export class AppError extends Error{
    constructor(
        public message:string,
        public statusCode = 500,
        public details?: any
    ){
        super(message)
        this.name = 'AppError'
    }
}

export class AuthError extends AppError{
    constructor(message = 'Unauthorized', details?:any){
        super(message, 401, details);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details?: any) {
    super(message, 403, details)
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Invalid input', details?: any) {
    super(message, 400, details)
    }
}
