type SuccessResponse<T extends object = {}> = T & { readonly success: true };
interface ErrorResponse {
	readonly success: false;
	readonly message: string;
}

type Response<T extends object = {}> = SuccessResponse<T> | ErrorResponse;
type ObjectResponse<T> = { readonly success: true; readonly value: T } | ErrorResponse;

type ResponseResult<T extends Response> = T extends SuccessResponse<infer R> ? R : never;
