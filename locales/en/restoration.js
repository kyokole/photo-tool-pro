export default {
  "restoration": {
    "title": "Old Photo Restoration",
    "subtitle": "Breathe new life into old memories",
    "uploadButton": "Select Photo to Restore",
    "uploadPrompt": "or drag and drop an image here",
    "supportedFormats": "Supports: PNG, JPG, WEBP",
    "restoreAnother": "Restore Another Photo",
    "errorTitle": "An error occurred during restoration",
    "dropPrompt": "Drop image to start restoring",
    "restoreButton": "Start Restoration",
    "originalAlt": "Original photo to be restored",
    "resultAlt": "Restored photo result",
    "changeImage": "Change Photo",
     "presets": {
      "title": "Quick Presets",
      "quickRestore": "Quick Restore",
      "fullRestore": "Full & Colorize"
    },
    "options": {
        "auto": "Auto",
        "core": {
            "title": "Core Options",
            "level": "Restoration Level",
            "scratches": "Remove scratches & damage",
            "colorize": "Colorize the photo"
        },
        "face": {
            "title": "Facial Enhancement",
            "enhance": "Enhance face clarity (Eyes, skin, hair)",
            "gender": "Gender",
            "age": "Age",
            "genders": {
                "male": "Male",
                "female": "Female"
            },
            "ages": {
                "child": "Child",
                "young_adult": "Young Adult",
                "adult": "Adult",
                "elderly": "Elderly"
            }
        },
        "context": {
            "title": "Additional Context (Advanced)",
            "placeholder": "e.g., Vietnamese wedding photo 1960s, old military uniform..."
        }
    }
  },
  "resultStages": {
    "original": {
      "title": "Original Photo",
      "description": "This is the initial image you uploaded."
    },
    "step1": {
      "title": "Step 1: Initial Cleaning",
      "description": "The AI performs a gentle cleaning pass to remove basic noise and blur, clarifying the main details on the face and background."
    },
    "step2": {
      "title": "Step 2: Advanced Restoration",
      "description": "Applies deep learning algorithms to repair scratches, tears, and more severe damage. The AI reconstructs areas with lost detail while ensuring the person's identity is preserved."
    },
    "step3": {
      "title": "Step 3: Colorization & Finalizing",
      "description": "The AI naturally colorizes the black and white photo, applying a warm tone for a nostalgic feel. Final details are sharpened to produce a complete, vibrant, and like-new image."
    }
  },
  "pipelineSteps": {
    "initial": "Initial cleaning...",
    "advanced": "Advanced restoration...",
    "finalize": "Colorizing & finalizing...",
    "complete": "Completed!"
  },
  "pipelineTracker": {
    "title": "Restoration Pipeline"
  },
  "resultCard": {
    "viewFullImage": "View full image"
  },
  "loader": {
    "patience_restoration": "This process might take a moment. Thank you for your patience."
  }
}