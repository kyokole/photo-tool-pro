export default {
    "batch": {
        // --- Keys for Creative Studio Batch Processor (and shared keys) ---
        "title": "ID Photo Batch Processor", // Overwritten for ID Photo
        "subtitle": "Queue {{count}} photos to process with the same settings.", // Overwritten for ID Photo

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
            // Creative Studio
            "queued": "Queued",
            "running": "Running",
            "success": "Success",
            "failed": "Failed",
            // ID Photo
            "pending": "Pending",
            "processing": "Processing",
            "done": "Done",
            "error": "Error"
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
        },

        // --- Keys for ID Photo Batch Processor ---
        "jobList": "Job List",
        "statusSummary": "{{completed}}/{{total}} photos completed",
        "addPhotos": "Add Photos",
        "clear": "Clear Queue",
        "settingsTitle": "Batch Settings",
        "processingAll": "Processing All...",
        "generateAll": "Generate All ({{count}} photos)",
        "zoom": "Zoom",
        "vipLock": {
            "title": "VIP Batch Processing Feature",
            "description": "Processing multiple photos at once is a premium feature. Please upgrade to use it.",
            "button": "Contact & Upgrade"
        },
        "vipFeatureAlert": "Batch processing is a VIP feature."
    }
}