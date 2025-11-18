export default {
  "themes": {
    "roseGoldGlam": "Rose Gold Glam",
    "cyberpunkNight": "Cyberpunk Night",
    "galacticCobalt": "Galactic Cobalt",
    "synthwaveGrid": "Synthwave Grid",
    "change": "Change Theme",
    "select": "Select Theme"
  },
  "resultCard": {
      "similarityScore": "Similarity Score"
  },
  "aiStudio": {
    "title": "AI Studio",
    "subtitle": "The creative toolkit for every idea",
    "uploadPrompt": "Drag & drop or click to select a file",
    "numImages": "Number of images",
    "generateCount": "Will generate {{count}} images",
    "generating": "Generating...",
    "noTurns": "No turns left",
    "generate": "Generate",
    "comingSoon": "Coming Soon",
    "library": {
      "title": "Library",
      "openAria": "Open image library",
      "deleteConfirm": "Are you sure you want to delete this image?",
      "emptyTitle": "Library is empty",
      "emptySubtitle": "Images you create will be saved here.",
      "delete": "Delete image"
    },
    "gallery": {
      "noImagesTitle": "No results yet",
      "noImagesSubtitle": "Your creations will appear here after generation.",
      "zoom": "Zoom",
      "zoomedAlt": "Zoomed image",
      "createVideo": "Create Video"
    },
    "multiSelect": {
      "placeholder": "Select one or more"
    },
    "trends": {
      "fetching": "Fetching trends...",
      "fetchButton": "Find Hot Trends",
      "selectLabel": "Select trends to try",
      "invalidResponse": "AI response did not contain a valid trend list.",
      "parseError": "Could not parse the trend list from the AI. Please try again.",
      "fetchError": "Could not fetch the trend list. Please try again."
    },
    "scene": {
      "title": "Select or describe a scene"
    },
    "couple": {
      "person1": "Person 1 (Left)",
      "person2": "Person 2 (Right)"
    },
    "composite": {
      "mainSubject": "Main Subject",
      "uploadMain": "Upload main subject image",
      "mainDesc": "Describe the main subject",
      "mainDescPlaceholder": "e.g., man in a suit",
      "scene": "Describe the scene & composition",
      "scenePlaceholder": "Describe in detail how you want the elements arranged, the lighting, the overall mood of the photo...",
      "additional": "Additional Component",
      "additionalDesc": "Describe additional component",
      "add": "Add Component"
    },
    "features": {
      "product_photo": "Product Photo",
      "hot_trend_photo": "Hot Trend Photo",
      "try_on_outfit": "Try On Outfit",
      "place_in_scene": "Place in Scene",
      "birthday_photo": "Birthday Photo",
      "couple_compose": "Couple Composite",
      "fashion_studio": "Fashion & Studio",
      "extract_outfit": "Extract Outfit",
      "change_hairstyle": "Change Hairstyle",
      "create_album": "Create Album",
      "creative_composite": "Creative Composite",
      "ai_thumbnail_designer": "AI Thumbnail Designer",
      "batch_generator": "Batch Generator",
      "image_variation_generator": "Image Variation Generator",
      "korean_style_studio": "Korean Style Studio",
      "yoga_studio": "Yoga Studio"
    },
    "inputs": {
      "common": {
        "frameStyle": {
          "label": "Framing Style",
          "options": {
            "fullBody": "Full Body",
            "halfBody": "Half Body",
            "shoulderPortrait": "Shoulder Portrait",
            "cinematicWide": "Cinematic Wide"
          }
        },
        "aspectRatio": {
          "label": "Aspect Ratio"
        }
      },
      "product_photo": {
        "subject_image": {
          "label": "Model's Photo"
        },
        "product_image": {
          "label": "Product Photo (optional)"
        },
        "prompt_detail": {
          "label": "Detailed description (pose, expression...)",
          "placeholder": "e.g., model is smiling, looking at the camera"
        }
      },
      "hot_trend_photo": {
        "subject_image": {
          "label": "Your Photo"
        }
      },
      "try_on_outfit": {
        "subject_image": {
          "label": "Model's Photo"
        },
        "outfit_image": {
          "label": "Outfit Photo"
        },
        "prompt_detail": {
          "label": "Detailed description (background...)",
          "placeholder": "e.g., standing in a studio, on the street..."
        }
      },
      "place_in_scene": {
        "subject_image": {
          "label": "Model's Photo"
        },
        "background_options": {
          "label": "Select a preset background",
          "options": {
            "beach": "Beach",
            "cafe": "Cafe",
            "street": "Street",
            "library": "Library",
            "garden": "Garden",
            "rooftop": "Rooftop",
            "forest": "Forest",
            "field": "Field",
            "spaceship": "Spaceship"
          }
        },
        "custom_background_prompt": {
          "label": "Or describe your own background",
          "placeholder": "e.g., sitting on a throne, in a palace..."
        },
        "background_image": {
          "label": "Or upload your background image"
        }
      },
      "birthday_photo": {
        "subject_image": {
          "label": "Your Photo"
        },
        "birthday_scenes": {
          "label": "Select birthday concepts",
          "options": {
            "outdoorParty": "Outdoor party",
            "cozyIndoors": "Cozy indoors",
            "studioShoot": "Studio shoot",
            "blowingCandles": "Blowing candles",
            "confettiShower": "Confetti shower",
            "feastTable": "Feast table",
            "cuteGifts": "Next to cute gifts",
            "rooftopNight": "Rooftop at night"
          }
        }
      },
      "couple_compose": {
        "person_left_image": {
          "label": "Person 1's Photo"
        },
        "person_left_gender": {
          "label": "Person 1's Gender"
        },
        "genders": {
          "male": "Male",
          "female": "Female",
          "other": "Other"
        },
        "person_right_image": {
          "label": "Person 2's Photo"
        },
        "person_right_gender": {
          "label": "Person 2's Gender"
        },
        "affection_action": {
          "label": "Action/Emotion",
          "options": {
            "holdingHands": "Holding hands",
            "gentleHug": "Gentle hug",
            "headOnShoulder": "Head on shoulder",
            "foreheadTouch": "Forehead touch",
            "armInArm": "Arm in arm",
            "backHug": "Back hug",
            "parkBench": "Sitting on a park bench",
            "sunset": "Watching the sunset together"
          }
        },
        "couple_background": {
          "label": "Select a background",
          "options": {
            "park": "Park",
            "street": "Street",
            "beach": "Beach",
            "studio": "Studio",
            "cafe": "Cafe",
            "garden": "Garden"
          }
        },
        "custom_background": {
          "label": "Or upload a custom background"
        },
        "aesthetic_style": {
          "label": "Photo Style",
          "options": {
            "warm": "Warm tone (vintage)",
            "clear": "Clear tone (Korean)",
            "minimalist": "Minimalist",
            "film": "Film look"
          }
        }
      },
      "fashion_studio": {
        "subject_image": {
          "label": "Model's Photo"
        },
        "style_level": {
          "label": "Style",
          "options": {
            "magazine": "Magazine Cover",
            "lookbook": "Lookbook",
            "street": "Street Style",
            "elegant": "Elegant"
          }
        },
        "wardrobe": {
          "label": "Wardrobe & Accessories",
          "options": {
            "gown": "Evening Gown",
            "satinDress": "Satin Dress",
            "bodysuit": "Bodysuit",
            "corsetBlazer": "Corset Blazer",
            "swimsuit": "Swimsuit",
            "croptopSet": "Croptop Set",
            "gloves": "Gloves",
            "choker": "Choker",
            "heels": "High Heels"
          }
        },
        "wardrobe_refs": {
          "label": "Wardrobe Reference Photo"
        },
        "pose_style": {
          "label": "Pose",
          "options": {
            "handOnHip": "Hand on hip",
            "crossedLegs": "Crossed legs",
            "overTheShoulder": "Over the shoulder",
            "sCurve": "S-Curve"
          }
        },
        "sexy_background": {
          "label": "Background",
          "options": {
            "minimalistStudio": "Minimalist Studio",
            "silkBackdrop": "Silk Backdrop",
            "sunsetWindow": "Sunset Window",
            "velvetChair": "Velvet Chair",
            "hotelHallway": "Hotel Hallway"
          }
        },
        "custom_bg": {
          "label": "Custom Background Photo"
        },
        "lighting": {
          "label": "Lighting",
          "options": {
            "softbox": "Softbox",
            "rimlight": "Rimlight",
            "sunset": "Sunset",
            "lowkey": "Low-key (high contrast)"
          }
        }
      },
      "extract_outfit": {
        "subject_image": {
          "label": "Photo containing the outfit"
        }
      },
      "change_hairstyle": {
        "subject_image": {
          "label": "Portrait Photo"
        },
        "gender": {
          "label": "Gender",
          "options": {
            "female": "Female",
            "male": "Male"
          },
          "placeholder": "Select gender to see hairstyles",
          "placeholder_first": "Please select a gender first"
        },
        "hairstyle": {
          "label": "Hairstyle",
          "placeholder": "Please select a gender first"
        },
        "hair_color": {
          "label": "Hair Color",
          "options": {
            "naturalBlack": "Natural Black",
            "chocolateBrown": "Chocolate Brown",
            "chestnutBrown": "Chestnut Brown",
            "platinumBlonde": "Platinum Blonde",
            "honeyBlonde": "Honey Blonde",
            "wineRed": "Wine Red",
            "ashGray": "Ash Gray",
            "mossGreen": "Moss Green",
            "pastelPink": "Pastel Pink",
            "smokyPurple": "Smoky Purple"
          }
        },
        "hair_length": {
          "label": "Hair Length",
          "options": {
            "veryShort": "Very Short",
            "short": "Short",
            "shoulder": "Shoulder-length",
            "long": "Long",
            "veryLong": "Very Long"
          }
        }
      },
      "create_album": {
        "subject_image": {
          "label": "Your Photo"
        },
        "poses": {
          "label": "Select Poses",
          "options": {
            "frontFacing": "Front-facing",
            "handOnHip": "Hand on hip",
            "overTheShoulder": "Over the shoulder",
            "sittingCrossLegged": "Sitting cross-legged",
            "leaning": "Leaning",
            "walking": "Walking",
            "lookingUp": "Looking up",
            "jumping": "Jumping",
            "closeUpSmiling": "Close-up smiling",
            "closeUpThoughtful": "Close-up thoughtful",
            "holdingProp": "Holding a prop",
            "windyHair": "Windy hair",
            "silhouette": "Silhouette",
            "handsInPockets": "Hands in pockets",
            "running": "Running",
            "touchingHair": "Touching hair",
            "lookingAway": "Looking away",
            "sittingOnStairs": "Sitting on stairs",
            "armsCrossed": "Arms crossed",
            "simpleYoga": "Simple yoga pose"
          }
        },
        "backgrounds": {
          "label": "Select Backgrounds",
          "options": {
            "tokyo": "Tokyo Street",
            "paris": "Eiffel Tower, Paris",
            "bali": "Heaven's Gate, Bali",
            "library": "Library",
            "roseGarden": "Rose Garden",
            "rooftop": "City Rooftop",
            "studio": "Professional Studio",
            "autumnForest": "Autumn Forest",
            "lavenderField": "Lavender Field",
            "hoiAn": "Hoi An Ancient Town"
          }
        }
      },
      "korean_style_studio": {
        "subject_image": { "label": "Your Original Photo" },
        "k_concept": { "label": "Select Concept" },
        "quality": {
            "label": "Image Quality",
            "options": {
                "standard": "Standard",
                "high": "High",
                "ultra": "Ultra"
            }
        },
        "face_consistency": { "label": "Face Consistency" },
        "aspectRatios": {
            "square": "1:1 Square",
            "portrait": "3:4 Portrait",
            "story": "9:16 Story"
        }
      },
      "yoga": {
        "subject_image": { "label": "Your Portrait Photo" },
        "pose_level": {
          "label": "Pose Level",
          "options": {
            "beginner": "Beginner",
            "intermediate": "Intermediate",
            "advanced": "Advanced"
          }
        },
        "yoga_pose": {
          "label": "Yoga Pose",
          "placeholder": "Select a level first"
        },
        "location": {
          "label": "Location",
          "options": {
            "studio": "Minimalist Studio",
            "beach": "Beach at Sunrise",
            "forest": "Serene Forest",
            "mountain": "Mountain Peak",
            "temple": "Ancient Temple"
          }
        },
        "lighting": {
          "label": "Lighting",
          "options": {
            "softStudio": "Soft Studio Light",
            "sunrise": "Golden Sunrise",
            "dramatic": "Dramatic Contrast"
          }
        },
        "outfit": {
          "label": "Outfit",
          "options": {
            "modern": "Modern Yoga Wear",
            "linen": "Flowy Linen Clothes",
            "traditional": "Traditional Attire"
          }
        },
        "poses": {
          "beginner": {
            "tadasana": "Mountain Pose (Tadasana)",
            "vrikshasana": "Tree Pose (Vrikshasana)",
            "adhoMukhaSvanasana": "Downward-Facing Dog (Adho Mukha Svanasana)",
            "virabhadrasanaI": "Warrior I (Virabhadrasana I)",
            "virabhadrasanaII": "Warrior II (Virabhadrasana II)",
            "trikonasana": "Triangle Pose (Trikonasana)"
          },
          "intermediate": {
            "bakasana": "Crow Pose (Bakasana)",
            "sirsasana": "Headstand (Sirsasana)",
            "sarvangasana": "Shoulder Stand (Sarvangasana)",
            "urdhvaDhanurasana": "Wheel Pose (Urdhva Dhanurasana)",
            "natarajasana": "Dancer's Pose (Natarajasana)"
          },
          "advanced": {
            "ekaPadaKoundinyasanaII": "Flying Splits Pose (Eka Pada Koundinyasana II)",
            "pinchaMayurasana": "Feathered Peacock Pose (Pincha Mayurasana)",
            "adhoMukhaVrikshasana": "Handstand (Adho Mukha Vrikshasana)",
            "visvamitrasana": "Visvamitra's Pose (Visvamitrasana)",
            "vasisthasana": "Side Plank Pose (Vasisthasana)",
            "ekaPadaRajakapotasana": "King Pigeon Pose (Eka Pada Rajakapotasana)",
            "svargaDvijasana": "Bird of Paradise Pose (Svarga Dvijasana)",
            "tittibhasana": "Firefly Pose (Tittibhasana)",
            "astavakrasana": "Eight-Angle Pose (Astavakrasana)",
            "vrischikasana": "Scorpion Pose (Vrischikasana)",
            "handstandHollowback": "Handstand Hollowback Pose",
            "scorpionHandstand": "Scorpion Handstand Pose",
            "ustrasana": "Camel Pose (Ustrasana)",
            "anjaneyasanaBackbend": "Crescent Moon Pose with Backbend (Anjaneyasana)",
            "seatedWheelPose": "Seated Wheel Pose",
            "hanumanasana": "Monkey Pose / Splits (Hanumanasana)",
            "ekaPadaGalavasana": "Flying Pigeon Pose (Eka Pada Galavasana)",
            "compassPose": "Compass Pose (Parivrtta Surya Yantrasana)",
            "gandaBherundasana": "Formidable Face Pose (Ganda Bherundasana)"
          }
        }
      }
    },
    "header": {
      "trainer": "AI Trainer",
      "galactic": "Galactic"
    },
    "uploadImages": {
      "title": "1. UPLOAD IMAGES",
      "model": "Upload Model Image",
      "reference": "Upload Reference Image",
      "note": "Model Image is required. The Reference Image (optional) will determine the style, color, and layout of the generated background."
    },
    "settingsPreview": {
      "title": "2. SETTINGS & PREVIEW"
    },
    "generationError": "Only {{successCount}} out of {{total}} requested images could be generated. Some images may have been blocked due to content policies.",
    "creativeTip": "✨ Creative Tip: Now, edit the prompt below to transform the image to your liking!"
  },
  "hairstyles": {
    "female": {
      "shortBob": "Short Bob",
      "longBob": "Long Bob (Lob)",
      "pixie": "Pixie",
      "mullet": "Mullet",
      "shag": "Shag",
      "tomboy": "Tomboy",
      "wavyCurls": "Wavy Curls",
      "waterWaves": "Water Waves",
      "cCurl": "C-Curl",
      "naturalStraight": "Natural Straight",
      "layeredStraight": "Layered Straight",
      "frenchBraid": "French Braid",
      "fishtailBraid": "Fishtail Braid",
      "highPonytail": "High Ponytail",
      "garlicBun": "Garlic Bun",
      "lowLooseBun": "Low Loose Bun",
      "himeCut": "Hime Cut",
      "wolfCut": "Wolf Cut",
      "butterflyCut": "Butterfly Cut",
      "hippieCurls": "Hippie Curls",
      "ramenCurls": "Ramen Curls",
      "asymmetricalBob": "Asymmetrical Bob",
      "shoulderLengthCCurl": "Shoulder-length C-Curl",
      "leafCut": "Leaf Cut",
      "koreanBangs": "Korean Bangs",
      "bluntBangs": "Blunt Bangs",
      "curtainBangs": "Curtain Bangs",
      "highlight": "Highlight",
      "balayage": "Balayage",
      "ombre": "Ombre"
    },
    "male": {
      "buzzCut": "Buzz Cut",
      "crewCut": "Crew Cut",
      "caesar": "Caesar",
      "classicUndercut": "Classic Undercut",
      "quiffUndercut": "Quiff Undercut",
      "pompadour": "Pompadour",
      "manBun": "Man Bun",
      "topKnot": "Top Knot",
      "mohican": "Mohican",
      "fauxHawk": "Faux Hawk",
      "sidePart": "Side Part",
      "middlePart": "Middle Part",
      "slickBack": "Slick Back",
      "layered": "Layered",
      "naturalWavy": "Natural Wavy",
      "kinkyCurls": "Kinky Curls",
      "spiky": "Spiky",
      "frenchCrop": "French Crop",
      "ivyLeague": "Ivy League",
      "dreadlocks": "Dreadlocks",
      "mullet": "Mullet",
      "commaHair": "Comma Hair",
      "twoBlock": "Two-block",
      "bowlCut": "Bowl Cut",
      "texturedCrop": "Textured Crop",
      "shoulderLength": "Shoulder-length",
      "taperFade": "Taper Fade",
      "highFade": "High Fade",
      "lowFade": "Low Fade",
      "dropFade": "Drop Fade"
    }
  },
  "trainer": {
    "title": "AI Trainer",
    "newConcept": "Create new concept",
    "deleteConfirm": "Are you sure you want to delete this concept? This action cannot be undone.",
    "nameRequired": "Concept name cannot be empty.",
    "imagesRequired": "At least 3 images are required to train a concept.",
    "nameExists": "A concept with this name already exists. Please choose a different name.",
    "editTitle": "Edit Concept",
    "newTitle": "Create New Concept",
    "empty": "No concepts yet. Click 'Create new concept' to start training the AI.",
    "nameLabel": "Concept Name",
    "typeLabel": "Concept Type",
    "typeCharacter": "Character (Preserves face)",
    "typeStyle": "Style (Color, lighting...)",
    "imagesLabel": "Training Images",
    "imagesHelp": "Upload at least 3 images. For characters, use photos with different facial angles. For styles, use photos with a common theme.",
    "insertTooltip": "Insert a trained character or style",
    "insertButton": "Insert concept",
    "character": "Character",
    "style": "Style"
  },
  "videoCreator": {
    "title": "Create Video from Image",
    "success": "Video created successfully!",
    "editTools": "Editing Tools (Preview)",
    "hideText": "Hide Text",
    "addText": "Add Text",
    "textHelp": "Drag to move, double-click to edit.",
    "editNotice": "Note: Edits are for preview only. The downloaded video is the original generated one.",
    "sourceImage": "Source Image",
    "step1": "1. Enter your idea",
    "ideaPlaceholder": "e.g., model walking on a New York street, hair blowing in the wind...",
    "generatingPrompt": "Generating prompt...",
    "generatePromptButton": "Generate Professional Prompt",
    "step2": "2. Detailed Prompt (AI-generated)",
    "promptPlaceholder": "AI-generated prompt will appear here...",
    "creatingVideo": "Creating video...",
    "step3": "3. Create Video",
    "apiKeySelect": {
      "title": "API Key Selection Required",
      "description": "The video generation feature requires you to select your own API Key. Please see the billing documentation",
      "docs": "here",
      "button": "Select API Key"
    },
    "editTextPlaceholder": "Double-click to edit",
    "editTextPrompt": "Enter new text:"
  },
  "promptAnalyzer": {
    "title": "Image Analyzer",
    "subtitle": "Turn any image into a detailed AI prompt",
    "uploadTitle": "1. Upload Your Image",
    "generatedTitle": "2. Generated Prompt",
    "generateButton": "Generate Prompt",
    "generatingButton": "Generating...",
    "placeholder": "Your generated prompt will appear here...",
    "copyButton": "Copy Prompt",
    "copiedButton": "Copied!",
    "faceLockLabel": "Face Lock",
    "faceLockDescription": "Instructs the AI to describe the original face with 100% accuracy",
    "faceLockPrefix": "Use 100% of my uploaded face as the identity reference, keeping the face natural and true to life with exact proportions and skin texture. ",
    "useInStudio": "Use in AI Studio",
    "upload": {
      "dragDrop": "Drag and drop an image here",
      "click": "click to select",
      "formats": "Accepts PNG, JPG, WEBP"
    },
    "error": {
      "uploadRequired": "Please upload an image first.",
      "unknown": "An unknown error occurred. Please try again.",
      "blocked": "Could not generate prompt as the image was blocked by safety filters. Please try a different image.",
      "stopped": "The AI model stopped generating abruptly (Reason: {{reason}}). Please try again.",
      "empty": "The AI model returned an empty response.",
      "invalidKey": "Invalid API key. Please check the configuration.",
      "serviceError": "Could not generate prompt from image. An unexpected error occurred with the AI service."
    },
    "howToUse": {
      "title": "Guide: How to Keep 100% of the Original Face",
      "step1Title": "Step 1: Understand 'Face Lock'",
      "step1Content": "When you enable 'Face Lock', this tool creates a prompt that describes the face in your image with EXTREME detail. This helps other AI tools redraw a person who looks VERY SIMILAR to the original.",
      "step2Title": "Step 2: The CORRECT 'Face Lock' Workflow (Important!)",
      "step2Content": "A text prompt <strong>ALONE CANNOT</strong> retain 100% of a face. You <strong>MUST</strong> combine this prompt with your original image in an AI tool that supports both image and text inputs (like our AI Studio or Midjourney).\n\n<strong>THE RIGHT PROCESS:</strong>\n1. Copy the prompt you just generated here.\n2. Open another AI image creation tool (e.g., AI Studio).\n3. <strong>Upload your original image</strong> into the image input field.\n4. <strong>Paste the copied prompt</strong> into the text input field.\n\nThis combination tells the AI: 'Take the face from this <strong>IMAGE</strong>, and apply the descriptions in this <strong>TEXT</strong> to the rest of the scene.'"
    }
  },
  "thumbnailDesigner": {
    "uploadSectionTitle": "1. Upload Images",
    "modelHint": "Upload Model Image",
    "refHint": "Upload Reference Image",
    "note": "Model Image is required. The Reference Image (optional) will determine the style, color, and layout of the generated background.",
    "settingsTitle": "2. Settings & Preview",
    "ratioLabel": "Thumbnail Ratio",
    "ratioHorizontal": "Horizontal (YouTube)",
    "ratioVertical": "Vertical (Shorts/Reels)",
    "programTitleLabel": "Program Title",
    "speakerLabel": "Speaker",
    "bySpeaker": "by {{speaker}}",
    "outfitLabel": "Outfit",
    "actionLabel": "Action / Pose",
    "extraLabel": "Extra Note",
    "updatePreview": "Update Preview",
    "generateButton": "Generate & Download Background",
    "generatingButton": "Generating...",
    "statusReady": "Ready",
    "statusGenerating": "Generating background with AI...",
    "statusSuccess": "Success! Automatically downloaded.",
    "statusError": "Error: {{error}}",
    "errorNoModel": "Please upload a 'Model Image' before generating."
  },
   "imageVariation": {
        "sections": {
            "upload": "1. Upload Reference Image",
            "configure": "2. Configure Variations"
        },
        "inputs": {
            "referenceImage": {
                "label": "Upload Reference Image"
            },
            "aspectRatio": {
                "label": "Aspect Ratio"
            },
            "identityLock": {
                "label": "Identity Lock"
            },
            "variationStrength": {
                "label": "Variation Strength"
            },
            "themeAnchor": {
                "label": "Main Theme"
            },
            "style": {
                "label": "Style"
            }
        },
        "options": {
             "aspectRatio": {
                "story": "9:16 (Story)",
                "portrait": "3:4 (Portrait)",
                "social": "4:5 (Social)",
                "square": "1:1 (Square)",
                "landscape": "16:9 (Landscape)"
            },
            "theme": {
                "character": "Character-appropriate",
                "classic": "Classic Portrait",
                "studio": "Clean Studio",
                "outdoor": "Outdoor Natural",
                "cozy": "Cozy Indoor",
                "urban": "Urban Street",
                "fashion": "Elegant Fashion",
                "garden": "Garden/Greenery",
                "cafe": "Daylight Café",
                "beach": "Beach Sunset",
                "minimal": "Minimal Backdrop"
            },
            "style": {
                "photorealistic": "Photorealistic",
                "cinematic": "Cinematic",
                "editorial": "Editorial",
                "minimal": "Minimal Pastel",
                "vivid": "Vivid Pop"
            }
        }
    },
    "koreanConcepts": {
        "winterSnowWhite": "Winter Snow White",
        "lonelyWinterSky": "Lonely Winter Sky",
        "winterInYourEyes": "Winter in Your Eyes",
        "coldWinterSnow": "Cold Winter Snow",
        "snowParadise": "Snow Paradise",
        "joyfulWinter": "Joyful Winter",
        "snowfallMoment": "Snowfall Moment",
        "gentleSnowySun": "Gentle Snowy Sun",
        "snowDance": "Snow Dance",
        "seoulPowerSuit": "Seoul Power Suit",
        "minimalCreamSet": "Minimal Cream Set",
        "navyExecutive": "Navy Executive Attire",
        "blackTweedIcon": "Black Tweed Icon",
        "satinSlipSeoul": "Satin Slip Dress Seoul",
        "camelLongCoat": "Camel Long Coat",
        "pastelStudio": "Pastel Studio",
        "marbleLobby": "Marble Lobby",
        "neonRainNight": "Neon Rain Night",
        "airportLuxe": "Airport Luxe",
        "runwayBackstage": "Runway Backstage",
        "whiteMonochrome": "White Monochrome",
        "cafeGlassLight": "Glass Cafe Light",
        "hanRiverGold": "Han River Golden Hour",
        "oversizedBlazer": "Oversized Blazer",
        "tweedCoOrdPearl": "Tweed Co-ord with Pearls",
        "beigeTonal": "Beige Tonal Look",
        "mintCleanLook": "Mint Clean Look",
        "blackOnBlack": "Black on Black",
        "silkMuse": "Silk Muse",
        "balletcoreMuse": "Balletcore Muse",
        "y2kFlashback": "Y2K Flashback",
        "seongsuCafeVibe": "Seongsu Cafe Vibe",
        "hanokSerenity": "Hanok Serenity",
        "blokecoreChic": "Blokecore Chic",
        "idPhotoTrend": "ID Photo Trend",
        "transparentUmbrellaWinter": "Transparent Umbrella in Snow",
        "sweetSnowWhite": "Sweet Snow White",
        "snowyPeak": "Snowy Peak",
        "snowyForestDream": "Snowy Forest Dream",
        "seagullSong": "Seagull Song",
        "iceWorld": "Ice World",
        "winterSnowDance": "Winter Snow Dance"
    }
}