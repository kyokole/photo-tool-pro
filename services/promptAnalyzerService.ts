
const callBackendApi = async (action: string, payload: any): Promise<any> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred with the API proxy.');
    }

    return data;
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
