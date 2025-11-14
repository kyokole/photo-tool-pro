import type { BeautyFeature, BeautyStyle } from '../types';

const intensityStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.intensity.none', englishLabel: 'None', type: 'intensity', value: 'None' },
    { id: 'light', labelKey: 'beautyStudio.styles.intensity.light', englishLabel: 'Light', type: 'intensity', value: 'Light' },
    { id: 'medium', labelKey: 'beautyStudio.styles.intensity.medium', englishLabel: 'Medium', type: 'intensity', value: 'Medium' },
    { id: 'strong', labelKey: 'beautyStudio.styles.intensity.strong', englishLabel: 'Strong', type: 'intensity', value: 'Strong' },
];

const smileStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.smile.none', englishLabel: 'None', type: 'intensity', value: 'None' },
    { id: 'subtle', labelKey: 'beautyStudio.styles.smile.subtle', englishLabel: 'Subtle Lift', type: 'intensity', value: 'Subtle' },
    { id: 'gentle', labelKey: 'beautyStudio.styles.smile.gentle', englishLabel: 'Gentle Smile', type: 'intensity', value: 'Gentle' },
    { id: 'joyful', labelKey: 'beautyStudio.styles.smile.joyful', englishLabel: 'Joyful Beam', type: 'intensity', value: 'Joyful' },
];

const appleLightingStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.appleLighting.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
    { id: 'natural', labelKey: 'beautyStudio.styles.appleLighting.natural', englishLabel: 'Natural Light', type: 'image', value: 'fas fa-sun' },
    { id: 'studio', labelKey: 'beautyStudio.styles.appleLighting.studio', englishLabel: 'Studio Light', type: 'image', value: 'far fa-lightbulb' },
    { id: 'dramatic', labelKey: 'beautyStudio.styles.appleLighting.dramatic', englishLabel: 'Dramatic', type: 'image', value: 'fas fa-theater-masks' },
];

const filmStockStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.filmStock.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
    { id: 'fuji', labelKey: 'beautyStudio.styles.filmStock.fuji', englishLabel: 'Fuji Velvia', type: 'image', value: 'fas fa-camera-retro' },
    { id: 'kodak', labelKey: 'beautyStudio.styles.filmStock.kodak', englishLabel: 'Kodak Portra', type: 'image', value: 'fas fa-camera' },
    { id: 'agfa', labelKey: 'beautyStudio.styles.filmStock.agfa', englishLabel: 'Agfa Vista', type: 'image', value: 'fas fa-video' },
];

const flashTypeStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.flashType.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
    { id: 'direct', labelKey: 'beautyStudio.styles.flashType.direct', englishLabel: 'Direct Flash', type: 'image', value: 'fas fa-bolt' },
    { id: 'ring', labelKey: 'beautyStudio.styles.flashType.ring', englishLabel: 'Ring Flash', type: 'image', value: 'far fa-circle' },
    { id: 'soft', labelKey: 'beautyStudio.styles.flashType.soft', englishLabel: 'Soft Bounce', type: 'image', value: 'fas fa-cloud' },
];

const flashGelStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.flashGel.none', englishLabel: 'None', type: 'color', value: 'transparent' },
    { id: 'warm', labelKey: 'beautyStudio.styles.flashGel.warm', englishLabel: 'Warm Gel', type: 'color', value: '#FFDDC1' },
    { id: 'cool', labelKey: 'beautyStudio.styles.flashGel.cool', englishLabel: 'Cool Gel', type: 'color', value: '#D6EAF8' },
    { id: 'red', labelKey: 'beautyStudio.styles.flashGel.red', englishLabel: 'Red Gel', type: 'color', value: '#FADBD8' },
];

const seasonalFilterStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.seasonalFilter.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
    { id: 'spring', labelKey: 'beautyStudio.styles.seasonalFilter.spring', englishLabel: 'Spring', type: 'image', value: 'fas fa-leaf' },
    { id: 'summer', labelKey: 'beautyStudio.styles.seasonalFilter.summer', englishLabel: 'Summer', type: 'image', value: 'fas fa-sun' },
    { id: 'autumn', labelKey: 'beautyStudio.styles.seasonalFilter.autumn', englishLabel: 'Autumn', type: 'image', value: 'fab fa-canadian-maple-leaf' },
    { id: 'winter', labelKey: 'beautyStudio.styles.seasonalFilter.winter', englishLabel: 'Winter', type: 'image', value: 'fas fa-snowflake' },
];

const idPhotoBgStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.idPhotoBg.none', englishLabel: 'None', type: 'color', value: 'transparent' },
    { id: 'white', labelKey: 'beautyStudio.styles.idPhotoBg.white', englishLabel: 'White', type: 'color', value: '#FFFFFF', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid white background suitable for an ID photo." },
    { id: 'blue', labelKey: 'beautyStudio.styles.idPhotoBg.blue', englishLabel: 'Blue', type: 'color', value: '#E1F5FE', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid light blue background suitable for an ID photo." },
    { id: 'gray', labelKey: 'beautyStudio.styles.idPhotoBg.gray', englishLabel: 'Gray', type: 'color', value: '#EEEEEE', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid light gray background suitable for an ID photo." },
];

const skinToneVariants = [
    { id: 'STV_PORCELAIN_COOL', name: 'Porcelain Cool' },
    { id: 'STV_FAIR_NEUTRAL', name: 'Fair Neutral' },
    { id: 'STV_LIGHT_WARM', name: 'Light Warm' },
    { id: 'STV_MEDIUM_NEUTRAL', name: 'Medium Neutral' },
    { id: 'STV_OLIVE_NEUTRAL', name: 'Olive Neutral' },
    { id: 'STV_TAN_GOLDEN', name: 'Tan Golden' },
    { id: 'STV_DEEP_WARM', name: 'Deep Warm' },
    { id: 'STV_DEEP_NEUTRAL', name: 'Deep Neutral' },
    { id: 'STV_ASIAN_NEUTRAL_PINK', name: 'East-Asian Neutral Pink' },
    { id: 'STV_SOUTH_ASIAN_GOLD_OLIVE', name: 'South-Asian Golden Olive' },
    { id: 'STV_UNIFORM_MATCH', name: 'Uniform Match (Face–Neck–Chest)' },
    { id: 'PG01', name: 'Porcelain Glow – Neutral Ivory' },
    { id: 'PG02', name: 'Porcelain Glow – Warm Peach' },
    { id: 'PG03', name: 'Porcelain Glow – Cool Rose' },
    { id: 'PG04', name: 'Porcelain Glow – Freckle Friendly' },
    { id: 'PG05', name: 'Porcelain Glow – Oily Control' },
    { id: 'PG06', name: 'Porcelain Glow – Jewelry Macro' },
    { id: 'PG07', name: 'Porcelain Glow – High Key Ivory' },
    { id: 'PG08', name: 'Porcelain Glow – Low Key Cocoa' },
    { id: 'PG09', name: 'Porcelain Glow – Soft Film' },
    { id: 'PG10', name: 'Porcelain Glow – Quick Mobile' },
];

const skinToneAdjustmentStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.intensity.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
    ...skinToneVariants.map((variant): BeautyStyle => ({
        id: variant.id,
        labelKey: `beautyStudio.styles.skinTone.${variant.id}`,
        englishLabel: variant.name,
        type: 'image',
        value: 'fas fa-palette',
        promptInstruction: `Retouch the skin to have a '${variant.name}' tone and look. Preserve natural skin texture.`
    })),
];

export const BEAUTY_FEATURES: BeautyFeature[] = [
    {
        id: 'apple_mode',
        labelKey: 'beautyStudio.features.apple_mode.label',
        englishLabel: 'Apple Mode',
        icon: 'fab fa-apple',
        subFeatures: [
            { id: 'lighting', labelKey: 'beautyStudio.subFeatures.lighting.label', englishLabel: 'Lighting', styles: appleLightingStyles },
            { id: 'color_profile', labelKey: 'beautyStudio.subFeatures.color_profile.label', englishLabel: 'Color Profile', styles: intensityStyles },
        ]
    },
    {
        id: 'camera_film',
        labelKey: 'beautyStudio.features.camera_film.label',
        englishLabel: 'Camera Film',
        icon: 'fas fa-film',
        subFeatures: [
            { id: 'film_stock', labelKey: 'beautyStudio.subFeatures.film_stock.label', englishLabel: 'Film Stock', styles: filmStockStyles },
            { id: 'grain', labelKey: 'beautyStudio.subFeatures.grain.label', englishLabel: 'Grain', styles: intensityStyles },
        ]
    },
    {
        id: 'flash',
        labelKey: 'beautyStudio.features.flash.label',
        englishLabel: 'Flash Camera',
        icon: 'fas fa-bolt',
        subFeatures: [
            { id: 'flash_type', labelKey: 'beautyStudio.subFeatures.flash_type.label', englishLabel: 'Flash Type', styles: flashTypeStyles },
            { id: 'color_gel', labelKey: 'beautyStudio.subFeatures.color_gel.label', englishLabel: 'Color Gel', styles: flashGelStyles },
        ]
    },
    {
        id: 'ai_filter',
        labelKey: 'beautyStudio.features.ai_filter.label',
        englishLabel: 'AI Filter',
        icon: 'fas fa-wand-magic-sparkles',
        badge: 'Free',
        subFeatures: [
            { id: 'seasonal', labelKey: 'beautyStudio.subFeatures.seasonal.label', englishLabel: 'Seasonal', styles: seasonalFilterStyles },
            { id: 'artistic', labelKey: 'beautyStudio.subFeatures.artistic.label', englishLabel: 'Artistic', styles: [
                { id: 'none', labelKey: 'beautyStudio.styles.artistic.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                { id: 'cartoon', labelKey: 'beautyStudio.styles.artistic.cartoon', englishLabel: 'Cartoon', type: 'image', value: 'fas fa-laugh-wink', promptInstruction: "Redraw the photo in a vibrant cartoon style." },
                { id: 'oil_painting', labelKey: 'beautyStudio.styles.artistic.oil_painting', englishLabel: 'Oil Painting', type: 'image', value: 'fas fa-palette', promptInstruction: "Transform the photo into a classical oil painting." },
                { id: 'pencil_sketch', labelKey: 'beautyStudio.styles.artistic.pencil_sketch', englishLabel: 'Pencil Sketch', type: 'image', value: 'fas fa-pencil-alt', promptInstruction: "Convert the photo into a detailed pencil sketch." },
            ] },
        ]
    },
    {
        id: 'hd_quality',
        labelKey: 'beautyStudio.features.hd_quality.label',
        englishLabel: 'Image Quality',
        icon: 'fas fa-arrows-up-to-line',
        badge: 'Hot',
        subFeatures: [
            {
                id: 'enhancement_level',
                labelKey: 'beautyStudio.subFeatures.enhancement_level.label',
                englishLabel: 'Enhancement Level',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.enhancement.none', englishLabel: 'None', type: 'intensity', value: 'None' },
                    { id: 'hd', labelKey: 'beautyStudio.styles.enhancement.hd', englishLabel: 'Sharpen HD', type: 'intensity', value: 'HD', promptInstruction: "Enhance the image to HD quality, improving sharpness and clarity." },
                    { id: 'upscale', labelKey: 'beautyStudio.styles.enhancement.upscale', englishLabel: '4K Upscale', type: 'intensity', value: '4K', promptInstruction: "Upscale the image to 4K resolution, intelligently adding detail and refining textures for a high-definition result." },
                    { id: 'denoise', labelKey: 'beautyStudio.styles.enhancement.denoise', englishLabel: 'Denoise', type: 'intensity', value: 'Denoise', promptInstruction: "Apply noise reduction to the image, smoothing out grain while preserving important details." },
                ]
            }
        ]
    },
    {
        id: 'beautify',
        labelKey: 'beautyStudio.features.beautify.label',
        englishLabel: 'Beautify',
        icon: 'fas fa-face-smile-beam',
        subFeatures: [
            {
                id: 'hair_style',
                labelKey: 'beautyStudio.subFeatures.hair_style.label',
                englishLabel: 'Hairstyle',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.hair.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'wavy_curls', labelKey: 'beautyStudio.styles.hair.wavy_curls', englishLabel: 'Wavy Curls', type: 'image', value: 'fas fa-wind', promptInstruction: "Change the person's hairstyle to beautiful, flowing wavy curls." },
                    { id: 'sleek_straight', labelKey: 'beautyStudio.styles.hair.sleek_straight', englishLabel: 'Sleek Straight', type: 'image', value: 'fas fa-stream', promptInstruction: "Change the person's hairstyle to sleek, straight hair." },
                    { id: 'chic_bob', labelKey: 'beautyStudio.styles.hair.chic_bob', englishLabel: 'Chic Bob', type: 'image', value: 'fas fa-user-circle', promptInstruction: "Change the person's hairstyle to a chic bob cut." },
                    { id: 'elegant_updo', labelKey: 'beautyStudio.styles.hair.elegant_updo', englishLabel: 'Elegant Updo', type: 'image', value: 'fas fa-user-tie', promptInstruction: "Change the person's hairstyle to an elegant updo." },
                ]
            },
            { id: 'smooth_skin', labelKey: 'beautyStudio.subFeatures.smooth_skin.label', englishLabel: 'Smooth Skin', styles: intensityStyles, promptInstruction: "Smooth the person's skin, reducing blemishes and wrinkles to a '{{style}}' degree while keeping a natural texture." },
            { id: 'concealer', labelKey: 'beautyStudio.subFeatures.concealer.label', englishLabel: 'Concealer', styles: intensityStyles, promptInstruction: "Apply digital concealer to cover blemishes and imperfections to a '{{style}}' degree." },
            { id: 'remove_oil', labelKey: 'beautyStudio.subFeatures.remove_oil.label', englishLabel: 'Remove Oiliness', styles: intensityStyles, promptInstruction: "Reduce shine and oiliness on the skin to a '{{style}}' degree for a more matte finish." },
            { id: 'slim_face', labelKey: 'beautyStudio.subFeatures.slim_face.label', englishLabel: 'Slim Face', styles: intensityStyles, promptInstruction: "Realistically and subtly slim the subject's face, focusing on the jawline and cheeks. Apply the effect to a '{{style}}' degree." },
            {
                id: 'skin_tone',
                labelKey: 'beautyStudio.subFeatures.skin_tone.label',
                englishLabel: 'Skin Tone',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.skinTone.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'ivory', labelKey: 'beautyStudio.styles.skinTone.ivory', englishLabel: 'Fair Ivory', type: 'color', value: '#FFFAF0', promptInstruction: "Adjust the skin tone to a 'Fair Ivory' shade." },
                    { id: 'beige', labelKey: 'beautyStudio.styles.skinTone.beige', englishLabel: 'Natural Beige', type: 'color', value: '#F5DEB3', promptInstruction: "Adjust the skin tone to a 'Natural Beige' shade." },
                    { id: 'honey', labelKey: 'beautyStudio.styles.skinTone.honey', englishLabel: 'Warm Honey', type: 'color', value: '#D2A679', promptInstruction: "Adjust the skin tone to a 'Warm Honey' shade." },
                    { id: 'bronze', labelKey: 'beautyStudio.styles.skinTone.bronze', englishLabel: 'Sun-kissed Bronze', type: 'color', value: '#A0522D', promptInstruction: "Adjust the skin tone to a 'Sun-kissed Bronze' shade." },
                ]
            },
            { id: 'expression_sub', labelKey: 'beautyStudio.subFeatures.expression_sub.label', englishLabel: 'Smile Adjustment', styles: smileStyles, promptInstruction: "Adjust the person's expression to create a '{{style}}'." },
            {
                id: '3d_lighting',
                labelKey: 'beautyStudio.subFeatures.3d_lighting.label',
                englishLabel: '3D Lighting',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.3dLighting.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'natural', labelKey: 'beautyStudio.styles.3dLighting.natural', englishLabel: 'Soft Natural', type: 'image', value: 'fas fa-sun', promptInstruction: "Apply a soft, natural 3D lighting effect to enhance facial features." },
                    { id: 'studio', labelKey: 'beautyStudio.styles.3dLighting.studio', englishLabel: 'Bright Studio', type: 'image', value: 'far fa-lightbulb', promptInstruction: "Apply a bright, professional studio lighting effect to the portrait." },
                    { id: 'contour', labelKey: 'beautyStudio.styles.3dLighting.contour', englishLabel: 'Dramatic Contour', type: 'image', value: 'fas fa-moon', promptInstruction: "Apply dramatic contour lighting to sculpt and define the facial features." },
                    { id: 'golden_hour', labelKey: 'beautyStudio.styles.3dLighting.golden_hour', englishLabel: 'Golden Hour', type: 'image', value: 'fas fa-cloud-sun', promptInstruction: "Relight the portrait with the warm, soft glow of a 'Golden Hour' sunset." },
                ]
            },
            { id: 'face_lift', labelKey: 'beautyStudio.subFeatures.face_lift.label', englishLabel: 'Face Lift', styles: intensityStyles, promptInstruction: "Apply a subtle digital face lift effect, tightening the jawline and brow area to a '{{style}}' degree." },
            { id: 'acne_removal', labelKey: 'beautyStudio.subFeatures.acne_removal.label', englishLabel: 'Acne Removal', styles: intensityStyles, promptInstruction: "Remove acne and skin blemishes with a '{{style}}' intensity, ensuring the skin texture looks natural." },
            { id: 'remove_double_chin', labelKey: 'beautyStudio.subFeatures.remove_double_chin.label', englishLabel: 'Remove Double Chin', styles: intensityStyles, promptInstruction: "Reduce or remove the appearance of a double chin to a '{{style}}' degree, defining the jawline." },
            { id: 'remove_dark_circles', labelKey: 'beautyStudio.subFeatures.remove_dark_circles.label', englishLabel: 'Remove Dark Circles', styles: intensityStyles, promptInstruction: "Reduce the appearance of dark circles under the eyes with a '{{style}}' intensity." },
            { id: 'teeth_whitening', labelKey: 'beautyStudio.subFeatures.teeth_whitening.label', englishLabel: 'Teeth Whitening', styles: intensityStyles, promptInstruction: "Whiten the teeth to a '{{style}}' degree, making sure they look bright but natural." },
        ]
    },
    {
        id: 'skin_tone_adjustment',
        labelKey: 'beautyStudio.features.skin_tone_adjustment.label',
        englishLabel: 'Skin Tone Adjustment',
        icon: 'fas fa-adjust',
        subFeatures: [
            {
                id: 'skin_tone_presets',
                labelKey: 'beautyStudio.subFeatures.skin_tone_presets.label',
                englishLabel: 'Presets',
                styles: skinToneAdjustmentStyles,
            },
        ]
    },
    {
        id: 'remove_bg',
        labelKey: 'beautyStudio.features.remove_bg.label',
        englishLabel: 'Remove Background',
        icon: 'fas fa-eraser',
        badge: 'NEW',
        subFeatures: [
            {
              id: 'replace_background',
              labelKey: 'beautyStudio.subFeatures.replace_background.label',
              englishLabel: 'Replace Background',
              styles: [
                  { id: 'none', labelKey: 'beautyStudio.styles.replaceBg.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                  { id: 'transparent', labelKey: 'beautyStudio.styles.replaceBg.transparent', englishLabel: 'Transparent', type: 'image', value: 'fas fa-layer-group', promptInstruction: "Carefully cut out the main subject from the photo and place it on a transparent background." },
                  { id: 'white', labelKey: 'beautyStudio.styles.replaceBg.white', englishLabel: 'White', type: 'image', value: 'fas fa-square-full', promptInstruction: "Carefully cut out the main subject from the photo and place it on a clean, solid white background." },
                  { id: 'city', labelKey: 'beautyStudio.styles.replaceBg.city', englishLabel: 'City', type: 'image', value: 'fas fa-city', promptInstruction: "Carefully cut out the main subject from the photo and place them on a realistic, slightly blurred city street background." },
              ]
            }
        ]
    },
    {
        id: 'ai_portrait',
        labelKey: 'beautyStudio.features.ai_portrait.label',
        englishLabel: 'AI Portrait',
        icon: 'fas fa-portrait',
        subFeatures: [
            {
                id: 'style',
                labelKey: 'beautyStudio.subFeatures.style.label',
                englishLabel: 'Style',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.aiPortrait.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'classic', labelKey: 'beautyStudio.styles.aiPortrait.classic', englishLabel: 'Classic', type: 'image', value: 'fas fa-history', promptInstruction: "Transform the photo into a classic, timeless portrait." },
                    { id: 'cartoon', labelKey: 'beautyStudio.styles.aiPortrait.cartoon', englishLabel: 'Cartoon', type: 'image', value: 'fas fa-laugh-wink', promptInstruction: "Redraw the portrait in a vibrant cartoon style." },
                    { id: 'oil_painting', labelKey: 'beautyStudio.styles.aiPortrait.oil_painting', englishLabel: 'Oil Painting', type: 'image', value: 'fas fa-palette', promptInstruction: "Transform the portrait into a classical oil painting." },
                    { id: 'pencil_sketch', labelKey: 'beautyStudio.styles.aiPortrait.pencil_sketch', englishLabel: 'Pencil Sketch', type: 'image', value: 'fas fa-pencil-alt', promptInstruction: "Convert the portrait into a detailed pencil sketch." },
                    { id: 'watercolor', labelKey: 'beautyStudio.styles.aiPortrait.watercolor', englishLabel: 'Watercolor', type: 'image', value: 'fas fa-paint-brush', promptInstruction: "Recreate the portrait in a soft and flowing watercolor style." },
                    { id: 'pop_art', labelKey: 'beautyStudio.styles.aiPortrait.pop_art', englishLabel: 'Pop Art', type: 'image', value: 'fas fa-star', promptInstruction: "Reimagine the portrait in a bold and colorful Pop Art style, reminiscent of Andy Warhol." },
                    { id: 'cyberpunk', labelKey: 'beautyStudio.styles.aiPortrait.cyberpunk', englishLabel: 'Cyberpunk', type: 'image', value: 'fas fa-robot', promptInstruction: "Transform the portrait into a futuristic, neon-lit Cyberpunk style." },
                ]
            }
        ]
    },
    {
        id: 'hair',
        labelKey: 'beautyStudio.features.hair.label',
        englishLabel: 'Hair',
        icon: 'fas fa-cut',
        subFeatures: [
            {
                id: 'nhuom',
                labelKey: 'beautyStudio.subFeatures.nhuom.label',
                englishLabel: 'Dye',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.dye.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'mat_ong', labelKey: 'beautyStudio.styles.dye.mat_ong', englishLabel: 'Honey Brown', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a warm 'Honey Brown'." },
                    { id: 'vang_teddy', labelKey: 'beautyStudio.styles.dye.vang_teddy', englishLabel: 'Teddy Blonde', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a 'Teddy Blonde' shade." },
                    { id: 'lanh', labelKey: 'beautyStudio.styles.dye.lanh', englishLabel: 'Cool Tone', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a 'Cool Tone' brown." },
                    { id: 'da_bao', labelKey: 'beautyStudio.styles.dye.da_bao', englishLabel: 'Leopard', type: 'image', value: 'fas fa-paw', promptInstruction: "Apply a bold leopard print pattern to the hair." },
                    { id: 'line_cam', labelKey: 'beautyStudio.styles.dye.line_cam', englishLabel: 'Orange Streaks', type: 'image', value: 'fas fa-grip-lines', promptInstruction: "Add vibrant orange streaks to the hair." },
                    { id: 'line_mai_do', labelKey: 'beautyStudio.styles.dye.line_mai_do', englishLabel: 'Red Bangs', type: 'image', value: 'fas fa-grip-lines-vertical', promptInstruction: "Color the bangs/fringe a bright red color." },
                    { id: 'than_tre', labelKey: 'beautyStudio.styles.dye.than_tre', englishLabel: 'Charcoal', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a deep 'Charcoal' black." },
                    { id: 'ash_gray', labelKey: 'beautyStudio.styles.dye.ash_gray', englishLabel: 'Ash Gray', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a trendy 'Ash Gray'." },
                    { id: 'pastel_pink', labelKey: 'beautyStudio.styles.dye.pastel_pink', englishLabel: 'Pastel Pink', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a soft 'Pastel Pink'." },
                    { id: 'electric_blue', labelKey: 'beautyStudio.styles.dye.electric_blue', englishLabel: 'Electric Blue', type: 'image', value: 'fas fa-tint', promptInstruction: "Change the hair color to a vivid 'Electric Blue'." },
                ]
            },
            {
                id: 'kieu_toc',
                labelKey: 'beautyStudio.subFeatures.kieu_toc.label',
                englishLabel: 'Hairstyle',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.hairstyle.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'long_wavy', labelKey: 'beautyStudio.styles.hairstyle.long_wavy', englishLabel: 'Long Wavy', type: 'image', value: 'fas fa-wind', promptInstruction: "Change the hairstyle to long and wavy." },
                    { id: 'sleek_ponytail', labelKey: 'beautyStudio.styles.hairstyle.sleek_ponytail', englishLabel: 'Sleek Ponytail', type: 'image', value: 'fas fa-user-ninja', promptInstruction: "Change the hairstyle to a sleek ponytail." },
                    { id: 'pixie_cut', labelKey: 'beautyStudio.styles.hairstyle.pixie_cut', englishLabel: 'Pixie Cut', type: 'image', value: 'fas fa-user-astronaut', promptInstruction: "Change the hairstyle to a short pixie cut." },
                    { id: 'messy_bun', labelKey: 'beautyStudio.styles.hairstyle.messy_bun', englishLabel: 'Messy Bun', type: 'image', value: 'fas fa-user-secret', promptInstruction: "Change the hairstyle to a casual messy bun." },
                ]
            },
        ]
    },
    {
        id: 'expand_bg',
        labelKey: 'beautyStudio.features.expand_bg.label',
        englishLabel: 'Expand Background',
        icon: 'fas fa-expand-arrows-alt',
        promptInstruction: "You are an AI with outpainting capabilities. Expand the background of the image to a '{{style}}' aspect ratio using a content-aware fill that seamlessly matches the original image's style, lighting, and content.",
        subFeatures: [
            { id: 'ratio', labelKey: 'beautyStudio.subFeatures.ratio.label', englishLabel: 'Aspect Ratio', styles: [
                { id: 'none', labelKey: 'beautyStudio.styles.expandRatio.none', englishLabel: 'None', type: 'intensity', value: 'None' },
                { id: 'square', labelKey: 'beautyStudio.styles.expandRatio.square', englishLabel: 'Square 1:1', type: 'intensity', value: '1:1' },
                { id: 'portrait', labelKey: 'beautyStudio.styles.expandRatio.portrait', englishLabel: 'Portrait 4:5', type: 'intensity', value: '4:5' },
                { id: 'story', labelKey: 'beautyStudio.styles.expandRatio.story', englishLabel: 'Story 9:16', type: 'intensity', value: '9:16' },
            ]},
        ]
    },
    {
        id: 'expression',
        labelKey: 'beautyStudio.features.expression.label',
        englishLabel: 'Expression',
        icon: 'fas fa-smile',
        subFeatures: [
            {
                id: 'emotion',
                labelKey: 'beautyStudio.subFeatures.emotion.label',
                englishLabel: 'Emotion',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.emotion.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'happy', labelKey: 'beautyStudio.styles.emotion.happy', englishLabel: 'Happy', type: 'image', value: 'far fa-smile', promptInstruction: "Modify the person's expression to be genuinely happy, with a natural smile." },
                    { id: 'wink', labelKey: 'beautyStudio.styles.emotion.wink', englishLabel: 'Wink', type: 'image', value: 'far fa-grin-wink', promptInstruction: "Modify the person's expression to give a playful wink." },
                    { id: 'surprised', labelKey: 'beautyStudio.styles.emotion.surprised', englishLabel: 'Surprised', type: 'image', value: 'far fa-surprise', promptInstruction: "Modify the person's expression to look surprised." },
                    { id: 'sultry', labelKey: 'beautyStudio.styles.emotion.sultry', englishLabel: 'Sultry', type: 'image', value: 'far fa-kiss-wink-heart', promptInstruction: "Modify the person's expression to be sultry and alluring." },
                ]
            }
        ]
    },
    {
        id: 'id_photo',
        labelKey: 'beautyStudio.features.id_photo.label',
        englishLabel: 'ID Photo',
        icon: 'fas fa-id-card',
        subFeatures: [
            { id: 'background_color', labelKey: 'beautyStudio.subFeatures.background_color.label', englishLabel: 'Background Color', styles: idPhotoBgStyles },
        ]
    },
    {
        id: 'narrow',
        labelKey: 'beautyStudio.features.narrow.label',
        englishLabel: 'Narrow',
        icon: 'fas fa-compress-arrows-alt',
        subFeatures: [
            { id: 'face_shape', labelKey: 'beautyStudio.subFeatures.face_shape.label', englishLabel: 'Face Shape', styles: intensityStyles, promptInstruction: "Subtly narrow the overall face shape to a '{{style}}' degree." },
            { id: 'nose', labelKey: 'beautyStudio.subFeatures.nose.label', englishLabel: 'Nose', styles: intensityStyles, promptInstruction: "Subtly narrow the nose to a '{{style}}' degree." },
        ]
    },
    {
        id: 'dark_circles',
        labelKey: 'beautyStudio.features.dark_circles.label',
        englishLabel: 'Dark Circles',
        icon: 'fas fa-eye',
        promptInstruction: "Reduce the appearance of dark circles under the eyes with a '{{style}}' intensity.",
        subFeatures: [
            { id: 'concealment', labelKey: 'beautyStudio.subFeatures.concealment.label', englishLabel: 'Concealment', styles: intensityStyles },
        ]
    },
    {
        id: 'double_chin',
        labelKey: 'beautyStudio.features.double_chin.label',
        englishLabel: 'Double Chin',
        icon: 'fas fa-user-minus',
        promptInstruction: "Reduce or remove the appearance of a double chin to a '{{style}}' degree, defining the jawline.",
        subFeatures: [
            { id: 'reduction', labelKey: 'beautyStudio.subFeatures.reduction.label', englishLabel: 'Reduction', styles: intensityStyles },
        ]
    },
    {
        id: 'ai_enhance',
        labelKey: 'beautyStudio.features.ai_enhance.label',
        englishLabel: 'AI Enhance',
        icon: 'fas fa-magic',
        badge: 'Hot',
        subFeatures: [
            { id: 'auto_correction', labelKey: 'beautyStudio.subFeatures.auto_correction.label', englishLabel: 'Auto Correction', styles: intensityStyles, promptInstruction: "Automatically correct and enhance the lighting, color, and contrast of the photo to a '{{style}}' degree." },
            { id: 'color_boost', labelKey: 'beautyStudio.subFeatures.color_boost.label', englishLabel: 'Color Boost', styles: intensityStyles, promptInstruction: "Boost the vibrance and saturation of the colors in the photo to a '{{style}}' degree." },
        ]
    },
    {
        id: 'head_size',
        labelKey: 'beautyStudio.features.head_size.label',
        englishLabel: 'Head Size',
        icon: 'fas fa-ruler-horizontal',
        promptInstruction: "Adjust the size of the person's head by a '{{style}}' amount.",
        subFeatures: [
            { id: 'size', labelKey: 'beautyStudio.subFeatures.size.label', englishLabel: 'Size', styles: intensityStyles },
        ]
    },
    {
        id: 'makeup',
        labelKey: 'beautyStudio.features.makeup.label',
        englishLabel: 'Makeup',
        icon: 'fas fa-paint-brush',
        subFeatures: [
            {
                id: 'son_moi',
                labelKey: 'beautyStudio.subFeatures.son_moi.label',
                englishLabel: 'Lipstick',
                promptInstruction: "Apply a '{{style}}' colored lipstick to the lips.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.lipstickColor.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'rd01', labelKey: 'beautyStudio.styles.lipstickColor.rd01', englishLabel: 'RD01 Red', type: 'color', value: '#C7383B' },
                    { id: 'pk04', labelKey: 'beautyStudio.styles.lipstickColor.pk04', englishLabel: 'PK04 Pink', type: 'color', value: '#E87A7D' },
                    { id: 'pk01', labelKey: 'beautyStudio.styles.lipstickColor.pk01', englishLabel: 'PK01 Light Pink', type: 'color', value: '#EA89A0' },
                    { id: 'pk03', labelKey: 'beautyStudio.styles.lipstickColor.pk03', englishLabel: 'PK03 Deep Pink', type: 'color', value: '#E9527E' },
                    { id: 'or01', labelKey: 'beautyStudio.styles.lipstickColor.or01', englishLabel: 'OR01 Orange', type: 'color', value: '#E26D4F' },
                    { id: 'cr01', labelKey: 'beautyStudio.styles.lipstickColor.cr01', englishLabel: 'CR01 Coral', type: 'color', value: '#E58572' },
                    { id: 'rd03', labelKey: 'beautyStudio.styles.lipstickColor.rd03', englishLabel: 'RD03 Deep Red', type: 'color', value: '#B92B27' },
                    { id: 'vl04', labelKey: 'beautyStudio.styles.lipstickColor.vl04', englishLabel: 'VL04 Violet', type: 'color', value: '#D0A9C5' },
                    { id: 'br01', labelKey: 'beautyStudio.styles.lipstickColor.br01', englishLabel: 'BR01 Brown', type: 'color', value: '#A15F54' },
                    { id: 'pk05', labelKey: 'beautyStudio.styles.lipstickColor.pk05', englishLabel: 'PK05 Fuchsia', type: 'color', value: '#D94A8C' },
                    { id: 'nude_beige', labelKey: 'beautyStudio.styles.lipstickColor.nude_beige', englishLabel: 'Nude Beige', type: 'color', value: '#C9A995' },
                    { id: 'dusty_rose', labelKey: 'beautyStudio.styles.lipstickColor.dusty_rose', englishLabel: 'Dusty Rose', type: 'color', value: '#B56B73' },
                    { id: 'berry_plum', labelKey: 'beautyStudio.styles.lipstickColor.berry_plum', englishLabel: 'Berry Plum', type: 'color', value: '#8E3A59' },
                ]
            },
            {
                id: 'plump_lips',
                labelKey: 'beautyStudio.subFeatures.plump_lips.label',
                englishLabel: 'Plump Lips',
                styles: intensityStyles,
                promptInstruction: "Subtly increase the fullness of the lips to a '{{style}}' degree."
            },
            {
                id: 'kieu_son',
                labelKey: 'beautyStudio.subFeatures.kieu_son.label',
                englishLabel: 'Lip Style',
                styles: [
                    { id: 'none_finish', labelKey: 'beautyStudio.styles.lipStyle.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'matte_finish', labelKey: 'beautyStudio.styles.lipStyle.matte', englishLabel: 'Matte', type: 'image', value: 'fas fa-lips', promptInstruction: "Change the lipstick finish to matte." },
                    { id: 'glossy_finish', labelKey: 'beautyStudio.styles.lipStyle.glossy', englishLabel: 'Glossy', type: 'image', value: 'fas fa-glass-whiskey', promptInstruction: "Change the lipstick finish to glossy." },
                    { id: 'satin_finish', labelKey: 'beautyStudio.styles.lipStyle.satin', englishLabel: 'Satin', type: 'image', value: 'fas fa-star-of-life', promptInstruction: "Change the lipstick finish to satin." },
                    { id: 'gradient_finish', labelKey: 'beautyStudio.styles.lipStyle.gradient', englishLabel: 'Gradient', type: 'image', value: 'fas fa-brush', promptInstruction: "Apply lipstick in a gradient or ombre style." },
                ]
            },
            {
                id: 'ma_hong',
                labelKey: 'beautyStudio.subFeatures.ma_hong.label',
                englishLabel: 'Blush',
                promptInstruction: "Apply a '{{style}}' colored blush to the cheeks.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.blush.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'rd01_blush', labelKey: 'beautyStudio.styles.blush.rd01', englishLabel: 'RD01 Red', type: 'color', value: '#E88B8C' },
                    { id: 'br01_blush', labelKey: 'beautyStudio.styles.blush.br01', englishLabel: 'BR01 Brown', type: 'color', value: '#D4A392' },
                    { id: 'pk01_blush', labelKey: 'beautyStudio.styles.blush.pk01', englishLabel: 'PK01 Pink', type: 'color', value: '#F0A2B1' },
                    { id: 'vl01_blush', labelKey: 'beautyStudio.styles.blush.vl01', englishLabel: 'VL01 Violet', type: 'color', value: '#D6A6C7' },
                    { id: 'nd01_blush', labelKey: 'beautyStudio.styles.blush.nd01', englishLabel: 'ND01 Nude', type: 'color', value: '#E6A89A' },
                    { id: 'or01_blush', labelKey: 'beautyStudio.styles.blush.or01', englishLabel: 'OR01 Orange', type: 'color', value: '#F0A88A' },
                    { id: 'peach_puff', labelKey: 'beautyStudio.styles.blush.peach_puff', englishLabel: 'Peach Puff', type: 'color', value: '#FFDAB9' },
                    { id: 'rose_pink', labelKey: 'beautyStudio.styles.blush.rose_pink', englishLabel: 'Rose Pink', type: 'color', value: '#E7ACCF' },
                ]
            },
            {
                id: 'duong_vien',
                labelKey: 'beautyStudio.subFeatures.duong_vien.label',
                englishLabel: 'Contour',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.contour.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'soft_sculpt', labelKey: 'beautyStudio.styles.contour.soft_sculpt', englishLabel: 'Soft Sculpt', type: 'image', value: 'fas fa-feather-alt', promptInstruction: "Apply soft, natural contouring to define the face." },
                    { id: 'round_face', labelKey: 'beautyStudio.styles.contour.round_face', englishLabel: 'For Round Face', type: 'image', value: 'far fa-circle', promptInstruction: "Apply contouring makeup suitable for a round face shape to add definition." },
                    { id: 'square_face', labelKey: 'beautyStudio.styles.contour.square_face', englishLabel: 'For Square Face', type: 'image', value: 'far fa-square', promptInstruction: "Apply contouring makeup to soften the angles of a square face shape." },
                    { id: 'oval_face', labelKey: 'beautyStudio.styles.contour.oval_face', englishLabel: 'For Oval Face', type: 'image', value: 'far fa-egg', promptInstruction: "Apply contouring makeup to enhance an oval face shape." },
                    { id: 'strobing', labelKey: 'beautyStudio.styles.contour.strobing', englishLabel: 'Strobing', type: 'image', value: 'fas fa-star', promptInstruction: "Apply highlighter to the high points of the face for a strobing effect." },
                ]
            },
            {
                id: 'may',
                labelKey: 'beautyStudio.subFeatures.may.label',
                englishLabel: 'Eyebrows',
                promptInstruction: "Reshape the eyebrows to a '{{style}}' style.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.eyebrows.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'vong_cung', labelKey: 'beautyStudio.styles.eyebrows.vong_cung', englishLabel: 'Natural Arch', type: 'image', value: 'fas fa-archway' },
                    { id: 'duoi', labelKey: 'beautyStudio.styles.eyebrows.duoi', englishLabel: 'Straight', type: 'image', value: 'fas fa-minus' },
                    { id: 'tu_nhien', labelKey: 'beautyStudio.styles.eyebrows.tu_nhien', englishLabel: 'Full & Natural', type: 'image', value: 'fas fa-leaf' },
                    { id: 'dam', labelKey: 'beautyStudio.styles.eyebrows.dam', englishLabel: 'Bold', type: 'image', value: 'fas fa-bold' },
                ]
            },
            {
                id: 'mau_long_may',
                labelKey: 'beautyStudio.subFeatures.mau_long_may.label',
                englishLabel: 'Eyebrow Color',
                promptInstruction: "Change the eyebrow color to '{{style}}'.",
                styles: [
                    { id: 'none_brow_color', labelKey: 'beautyStudio.styles.eyebrowColor.none', englishLabel: 'Default', type: 'color', value: 'transparent' },
                    { id: 'soft_black', labelKey: 'beautyStudio.styles.eyebrowColor.soft_black', englishLabel: 'Soft Black', type: 'color', value: '#363636' },
                    { id: 'dark_brown', labelKey: 'beautyStudio.styles.eyebrowColor.dark_brown', englishLabel: 'Dark Brown', type: 'color', value: '#5C4033' },
                    { id: 'light_brown', labelKey: 'beautyStudio.styles.eyebrowColor.light_brown', englishLabel: 'Light Brown', type: 'color', value: '#966953' },
                    { id: 'ash_blonde', labelKey: 'beautyStudio.styles.eyebrowColor.ash_blonde', englishLabel: 'Ash Blonde', type: 'color', value: '#B2BEB5' },
                ]
            },
            {
                id: 'long_mi',
                labelKey: 'beautyStudio.subFeatures.long_mi.label',
                englishLabel: 'Eyelashes',
                promptInstruction: "Apply '{{style}}' style false eyelashes.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.eyelashes.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'h_ngay_lashes', labelKey: 'beautyStudio.styles.eyelashes.h_ngay_lashes', englishLabel: 'Daily Natural', type: 'image', value: 'fas fa-eye' },
                    { id: 'barbie', labelKey: 'beautyStudio.styles.eyelashes.barbie', englishLabel: 'Barbie Doll', type: 'image', value: 'fas fa-pastafarianism' },
                    { id: 'xuong_2', labelKey: 'beautyStudio.styles.eyelashes.xuong_2', englishLabel: 'Wispy', type: 'image', value: 'fas fa-feather' },
                    { id: 'manga_3', labelKey: 'beautyStudio.styles.eyelashes.manga_3', englishLabel: 'Manga', type: 'image', value: 'fas fa-book-open' },
                ]
            },
            {
                id: 'ke_mat',
                labelKey: 'beautyStudio.subFeatures.ke_mat.label',
                englishLabel: 'Eyeliner',
                promptInstruction: "Apply eyeliner in a '{{style}}' style.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.eyeliner.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'tail', labelKey: 'beautyStudio.styles.eyeliner.tail', englishLabel: 'Winged', type: 'image', value: 'fas fa-fighter-jet' },
                    { id: 'natural', labelKey: 'beautyStudio.styles.eyeliner.natural', englishLabel: 'Natural', type: 'image', value: 'fas fa-pen-nib' },
                    { id: 'rose', labelKey: 'beautyStudio.styles.eyeliner.rose', englishLabel: 'Rose', type: 'image', value: 'fas fa-spa' },
                    { id: 'classic', labelKey: 'beautyStudio.styles.eyeliner.classic', englishLabel: 'Classic', type: 'image', value: 'fas fa-glasses' },
                    { id: 'double_wing', labelKey: 'beautyStudio.styles.eyeliner.double_wing', englishLabel: 'Double Wing', type: 'image', value: 'fas fa-angle-double-right' },
                    { id: 'graphic', labelKey: 'beautyStudio.styles.eyeliner.graphic', englishLabel: 'Graphic Liner', type: 'image', value: 'fas fa-pencil-ruler' },
                ]
            },
            {
                id: 've_mat',
                labelKey: 'beautyStudio.subFeatures.ve_mat.label',
                englishLabel: 'Eyeshadow',
                promptInstruction: "Apply '{{style}}' eyeshadow.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.eyeshadow.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'kem', labelKey: 'beautyStudio.styles.eyeshadow.kem', englishLabel: 'Cream', type: 'image', value: 'fas fa-cookie' },
                    { id: 'chai', labelKey: 'beautyStudio.styles.eyeshadow.chai', englishLabel: 'Tea', type: 'image', value: 'fas fa-coffee' },
                    { id: 'hoang_gia', labelKey: 'beautyStudio.styles.eyeshadow.hoang_gia', englishLabel: 'Royal', type: 'image', value: 'fas fa-crown' },
                    { id: 'cat', labelKey: 'beautyStudio.styles.eyeshadow.cat', englishLabel: 'Sand', type: 'image', value: 'fas fa-hourglass-half' },
                    { id: 'gach', labelKey: 'beautyStudio.styles.eyeshadow.gach', englishLabel: 'Brick', type: 'image', value: 'fas fa-building' },
                    { id: 'smokey', labelKey: 'beautyStudio.styles.eyeshadow.smokey', englishLabel: 'Smokey Eye', type: 'image', value: 'fas fa-cloud' },
                    { id: 'glitter', labelKey: 'beautyStudio.styles.eyeshadow.glitter', englishLabel: 'Glitter Pop', type: 'image', value: 'fas fa-star' },
                    { id: 'cut_crease', labelKey: 'beautyStudio.styles.eyeshadow.cut_crease', englishLabel: 'Cut Crease', type: 'image', value: 'fas fa-cut' },
                    { id: 'halo_eye', labelKey: 'beautyStudio.styles.eyeshadow.halo_eye', englishLabel: 'Halo Eye', type: 'image', value: 'fas fa-circle-notch' },
                ]
            },
            {
                id: 'tan_nhang',
                labelKey: 'beautyStudio.subFeatures.tan_nhang.label',
                englishLabel: 'Freckles',
                promptInstruction: "Add '{{style}}' style freckles to the face.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.freckles.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'lam_tam', labelKey: 'beautyStudio.styles.freckles.lam_tam', englishLabel: 'Lightly Dotted', type: 'image', value: 'fas fa-braille' },
                    { id: 'duoi_bong_mat', labelKey: 'beautyStudio.styles.freckles.duoi_bong_mat', englishLabel: 'Under Eye', type: 'image', value: 'fas fa-sort-down' },
                    { id: 'nang', labelKey: 'beautyStudio.styles.freckles.nang', englishLabel: 'Across Nose and Cheeks', type: 'image', value: 'fas fa-arrows-alt-h' },
                ]
            },
            {
                id: 'kinh_ap_trong',
                labelKey: 'beautyStudio.subFeatures.kinh_ap_trong.label',
                englishLabel: 'Contact Lenses',
                promptInstruction: "Change the eye color and style to look like '{{style}}' contact lenses.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.contacts.none', englishLabel: 'None', type: 'image', value: 'fas fa-ban' },
                    { id: 'hao_quang', labelKey: 'beautyStudio.styles.contacts.hao_quang', englishLabel: 'Aura', type: 'image', value: 'far fa-sun' },
                    { id: 'mau_vang', labelKey: 'beautyStudio.styles.contacts.mau_vang', englishLabel: 'Yellow', type: 'image', value: 'fas fa-eye' },
                    { id: 'mat_sang', labelKey: 'beautyStudio.styles.contacts.mat_sang', englishLabel: 'Bright Eyes', type: 'image', value: 'fas fa-eye' },
                    { id: 'xam_tro', labelKey: 'beautyStudio.styles.contacts.xam_tro', englishLabel: 'Ash Gray', type: 'image', value: 'fas fa-eye' },
                    { id: 'trong_den', labelKey: 'beautyStudio.styles.contacts.trong_den', englishLabel: 'Black Pupil', type: 'image', value: 'fas fa-eye' },
                    { id: 'cat_eye', labelKey: 'beautyStudio.styles.contacts.cat_eye', englishLabel: 'Cat Eye', type: 'image', value: 'fas fa-cat' },
                    { id: 'heterochromia', labelKey: 'beautyStudio.styles.contacts.heterochromia', englishLabel: 'Heterochromia', type: 'image', value: 'fas fa-adjust' },
                ]
            },
        ]
    },
];