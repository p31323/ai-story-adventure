export const parseGeminiError = (error: unknown): string => {
    // Convert the unknown error to a string for consistent processing.
    const message = error instanceof Error ? error.message : String(error);

    // Prioritize checking for known error keywords. This is often the most reliable way
    // to catch specific, common issues regardless of the error's exact format.
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
        return '您的 API 金鑰已超出目前方案的配額。這通常是因為短時間內請求次數過多。請稍後再試，或檢查您的 Google AI Platform 帳單與用量限制。';
    }
    if (message.includes('API key not valid')) {
        return '提供的 API 金鑰無效。請確認您的 API_KEY 環境變數是否正確設定。';
    }

    // If no specific keywords are found, attempt to parse the message as JSON.
    // The Gemini SDK often returns detailed errors in a JSON-formatted string.
    try {
        const jsonMatch = message.match(/{.*}/s);
        if (jsonMatch) {
            const errorObj = JSON.parse(jsonMatch[0]);
            // Extract the user-facing message from the nested error object.
            if (errorObj?.error?.message) {
                return `AI 服務回報錯誤: ${errorObj.error.message}`;
            }
        }
    } catch (e) {
        // The message was not valid JSON. This is expected for some error types.
        // We will fall through and return the original message string.
    }
    
    // If the error doesn't match known keywords and isn't a parseable JSON error,
    // return the original message as a fallback.
    return message;
};
