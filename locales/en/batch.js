export default {
    "batch": {
        "title": "Gemini 8K Batch Image Generator",
        "subtitle": "Queue multiple image generation tasks with custom settings and process them concurrently.",
        "addQueue": "1. Add Tasks to Queue",
        "results": "2. Results & Progress",
        "promptLabel": "Prompt",
        "promptPlaceholder": "e.g., A photorealistic image of a cat astronaut on Mars",
        "aspectRatioLabel": "Aspect Ratio",
        "numImagesLabel": "Number of Images",
        "inputType": "Input Type: Text-to-Image",
        "addToQueue": "Add to Queue",
        "or": "Or",
        "uploadFile": "Upload File (TXT/CSV/JSON)",
        "txtFormat": "TXT Format: One prompt per line.",
        "csvFormat": "CSV Format: prompt,aspectRatio,numOutputs (with header)",
        "jsonFormat": "JSON File: Array of objects {'prompt': '...', ...}",
        "pendingTasks": "Pending Tasks ({{count}}/50)",
        "concurrentTasks": "Concurrent Jobs (max 10)",
        "startProcessing": "Start Processing ({{count}}) Tasks",
        "noTasks": "No tasks have been submitted.",
        "noTasksDesc": "Add tasks and click \"Start Processing\" to begin.",
        "downloadAll": "Download All",
        "clearAll": "Clear All",
        "noSuccess": "No successful images to download.",
        "status": {
            "queued": "Queued",
            "running": "Running",
            "success": "Success",
            "failed": "Failed"
        },
        "retry": "Retry",
        "error": "Error",
        "successResults": "Successful Results",
        "progress": "{{completed}} / {{total}} jobs completed",
        "errors": {
            "queueFull": "Queue only has {{available}} slots left. Only the first {{available}} tasks from your file will be added.",
            "txtEmpty": "TXT file is empty or contains no valid prompts.",
            "csvInvalidRow": "Invalid row {{row}}: not enough columns.",
            "csvInvalidData": "Invalid or missing data in CSV at row {{row}}: \"{{line}}\"",
            "jsonNotArray": "JSON must be an array of tasks.",
            "jsonInvalidObject": "Invalid object in JSON at index {{index}}: {{item}}",
            "unsupportedFormat": "Unsupported file format. Please use .txt, .csv, or .json.",
            "fileProcessingError": "Error processing file: {{error}}"
        }
    }
}