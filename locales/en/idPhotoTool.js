export default {
  "idPhotoTool": {
    "title": "ID Photo Editor",
    "subtitle": "Create professional ID photos in seconds"
  },
  "controlPanel": {
    "title": "Control Panel",
    "uploadFirst": {
      "title": "Please Upload an Image",
      "description": "The control panel will be enabled after you upload an original image."
    },
    "tabs": {
      "layout": "Ratio",
      "background": "Background",
      "outfit": "Outfit",
      "face": "Face"
    },
    "layout": {
      "title": "Photo Ratio",
      "description": "Choose the aspect ratio for your ID photo."
    },
    "background": {
      "title": "Customize Background",
      "buttons": {
        "light_blue": "Light Blue",
        "white": "White",
        "custom": "Custom",
        "ai": "AI Background"
      },
      "aiPlaceholder": "Describe the background you want (e.g., bookshelf in a library, classic brick wall...)"
    },
    "outfit": {
      "title": "Customize Outfit",
      "keepOriginal": "Keep original outfit",
      "buttons": {
        "preset": "Presets",
        "custom": "Custom",
        "upload": "Upload"
      },
      "customPlaceholder": "Describe the outfit you want (e.g., black vest, pink ao dai...)",
      "uploadButton": "Upload Outfit Image",
      "uploadTip": "Tip: Use a transparent background PNG for best results."
    },
    "face": {
      "title": "Edit Face & Hair",
      "keepFeatures": {
        "label": "Face-Lock",
        "description": "Preserve 100% of the original facial features, expression, and characteristics. Only changes hair, clothes, background."
      },
      "hair": {
        "title": "Hairstyle",
        "styles": {
          "auto": "Auto (Neat)",
          "down": "Styled Down",
          "slicked_back": "Slicked Back",
          "keep_original": "Keep Original"
        }
      },
      "adjustments": {
        "title": "Adjustments",
        "smoothSkin": "Smooth Skin",
        "slightSmile": "Slight Smile"
      },
      "otherPlaceholder": "Other requests (e.g., wear glasses, remove mole...)"
    },
    "print": {
      "title": "Print Settings",
      "layout": {
        "label": "Print Paper Layout",
        "none": "No Print",
        "10x15": "10x15 cm sheet",
        "13x18": "13x18 cm sheet",
        "20x30": "20x30 cm sheet",
        "photoCount": "{{count}} photos ({{cols}}x{{rows}})"
      },
      "paper": {
        "label": "Print Paper Background",
        "options": {
          "white": "White",
          "gray": "Gray"
        }
      }
    },
    "vipLock": {
      "title": "VIP Feature",
      "description": "Fine-tuning after generation is a VIP feature. Upgrade to unlock all controls.",
      "button": "Contact & Upgrade"
    }
  },
  "imagePanes": {
    "originalTitle": "Original Photo",
    "resultTitle": "Result",
    "originalAlt": "User's original photo",
    "processedAlt": "Processed ID photo",
    "uploadButton": "Upload Photo",
    "dropPrompt": "or drag and drop an image here",
    "dropToUpload": "Drop to upload",
    "changeImage": "Change Image",
    "resultPlaceholder": "The result will appear here",
    "resultPlaceholderDesc": "Your generated image will appear here",
    "creatingPreview": "Creating preview...",
    "safeCropArea": "Safe crop area",
    "faceLocked": "Face-Locked",
    "aiAligned": "AI Aligned",
    "centerGuide": "Center guide",
    "uploadTips": {
      "title": "Tips for a great photo:",
      "tip1": "Take a clear, front-facing photo.",
      "tip2": "No sunglasses or hats.",
      "tip3": "Keep hair neat and away from the face."
    }
  }
}