
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        // Read the body ONCE as text.
        const errorText = await response.text();
        let errorMessage = errorText;

        try {
            // Then, TRY to parse that text as JSON.
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (e) {
            // If parsing fails, it was plain text. We already have the error message.
            // No extra action needed.
        }
        throw new Error(errorMessage);
    }

    return response.json();
};


export async function generatePromptFromImage(base64Image: string, mimeType: string, isFaceLockEnabled: boolean, language: string): Promise<string> {
    const { prompt } = await callBackendApi('generatePromptFromImage', {
        base64Image,
        mimeType,
        isFaceLockEnabled,
        language
    });
    return prompt;
}