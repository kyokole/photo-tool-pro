
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        let errorMessage = 'An unknown server error occurred.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || JSON.stringify(errorData);
        } catch (e) {
            errorMessage = await response.text();
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