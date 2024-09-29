export const successResponse: SuccessResponse = { success: true };
const emptyErrorResponse: ErrorResponse = { success: false, message: "" };

export const errorResponse = (text?: string): ErrorResponse => {
	if (!text) return emptyErrorResponse;
	return { success: false, message: text };
};
