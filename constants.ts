
import type { Settings, HeadshotStyle, AspectRatio, FashionAspectRatio, FashionStyle, FamilyStudioSettings, SelectOption, TemplateOption, VoiceOption } from './types';

export * from './constants/familyStudioConstants';
export * from './constants/footballConstants';
export * from './constants/beautyStudioConstants';
export * from './constants/creativeStudioConstants';

export const CREDIT_COSTS = {
    STANDARD_IMAGE: 2,
    HIGH_QUALITY_IMAGE: 5,
    VIDEO_GENERATION: 10,
    AUDIO_GENERATION: 2, // New cost for audio
};

// --- VOICE STUDIO CONSTANTS ---

export const VOICE_REGIONS = [
    { id: 'north', labelKey: 'voiceStudio.regions.north', icon: 'fas fa-landmark' },
    { id: 'central', labelKey: 'voiceStudio.regions.central', icon: 'fas fa-umbrella-beach' },
    { id: 'south', labelKey: 'voiceStudio.regions.south', icon: 'fas fa-water' },
    { id: 'special', labelKey: 'voiceStudio.regions.special', icon: 'fas fa-star' }, 
    { id: 'intl', labelKey: 'voiceStudio.regions.intl', icon: 'fas fa-globe' },
];

export const VOICE_OPTIONS: (VoiceOption & { stylePrompt: string })[] = [
    // --- MIỀN BẮC (NORTH) ---
    { 
        id: 'hanoi_female_26', 
        nameKey: 'voiceStudio.voices.north.hanoi_female_26', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'north', 
        icon: 'fas fa-book-open',
        provinceKey: 'hanoi',
        stylePrompt: "Đọc bằng giọng nữ Hà Nội chuẩn, rõ ràng, nhẹ nhàng, thanh lịch, giống một cô gái 26 tuổi có học thức, lịch sự và tự tin. Ngữ điệu mềm mại."
    },
    { 
        id: 'hanoi_male_news', 
        nameKey: 'voiceStudio.voices.north.hanoi_male_news', 
        geminiVoice: 'Zephyr', 
        gender: 'male', 
        regionKey: 'north', 
        icon: 'fas fa-newspaper',
        provinceKey: 'hanoi',
        stylePrompt: "Đọc bằng giọng nam Hà Nội chuẩn, trầm ấm, đĩnh đạc, tròn vành rõ chữ, giống một phát thanh viên tin tức thời sự VTV, nghiêm túc và tin cậy."
    },
    { 
        id: 'haiphong_male', 
        nameKey: 'voiceStudio.voices.north.haiphong_male', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'north', 
        icon: 'fas fa-anchor',
        provinceKey: 'haiphong',
        stylePrompt: "Đọc bằng giọng nam Hải Phòng, mạnh mẽ, phóng khoáng, hơi thô nhưng chân thật, ngữ điệu dứt khoát, to và rõ, đậm chất người vùng biển."
    },
    { 
        id: 'bacninh_female', 
        nameKey: 'voiceStudio.voices.north.bacninh_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'north', 
        icon: 'fas fa-music',
        provinceKey: 'bacninh',
        stylePrompt: "Đọc bằng giọng nữ Bắc Ninh, ngọt ngào như hát quan họ, lúng liếng, duyên dáng, âm sắc mềm mại và có độ nảy hạt."
    },
    { 
        id: 'thaibinh_female_story', 
        nameKey: 'voiceStudio.voices.north.thaibinh_female_story', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'north', 
        icon: 'fas fa-seedling',
        provinceKey: 'thaibinh',
        stylePrompt: "Đọc bằng giọng nữ Thái Bình, mộc mạc, chân chất, hơi trầm, nhịp độ chậm rãi, giống như đang kể chuyện tâm tình ở làng quê."
    },
    { 
        id: 'namdinh_male', 
        nameKey: 'voiceStudio.voices.north.namdinh_male_pod', 
        geminiVoice: 'Charon', 
        gender: 'male', 
        regionKey: 'north', 
        icon: 'fas fa-church',
        provinceKey: 'namdinh',
        stylePrompt: "Đọc bằng giọng nam Nam Định, giọng hơi đanh, rõ ràng, thực tế, giống như một người dẫn chương trình Podcast đời sống."
    },
    { 
        id: 'quangninh_male', 
        nameKey: 'voiceStudio.voices.north.quangninh_male', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'north', 
        icon: 'fas fa-mountain',
        provinceKey: 'quangninh',
        stylePrompt: "Đọc bằng giọng nam Quảng Ninh, khỏe khoắn, vui tươi, hào sảng, mang hơi thở của vùng mỏ và biển cả."
    },
    { 
        id: 'haiduong_female', 
        nameKey: 'voiceStudio.voices.north.haiduong_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'north', 
        icon: 'fas fa-cookie',
        provinceKey: 'haiduong',
        stylePrompt: "Đọc bằng giọng nữ Hải Dương, nhẹ nhàng, bình dị, không quá điệu đà nhưng rất dễ nghe và thiện cảm."
    },

    // --- MIỀN TRUNG (CENTRAL) ---
    { 
        id: 'hue_female', 
        nameKey: 'voiceStudio.voices.central.hue_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'central', 
        icon: 'fas fa-leaf',
        provinceKey: 'hue',
        stylePrompt: "Đọc bằng giọng nữ Huế, rất nhẹ nhàng, ngọt ngào, sâu lắng, mang đậm chất Cố đô, âm sắc kéo dài dịu dàng (dạ, thưa)."
    },
    { 
        id: 'nghean_male_story', 
        nameKey: 'voiceStudio.voices.central.nghean_male_story', 
        geminiVoice: 'Charon', 
        gender: 'male', 
        regionKey: 'central', 
        icon: 'fas fa-microphone',
        provinceKey: 'nghean',
        stylePrompt: "Đọc bằng giọng nam Nghệ An đặc trưng, trầm và nặng, chất phác, mộc mạc, phù hợp để đọc truyện đêm khuya hoặc tâm sự."
    },
    { 
        id: 'hatinh_female', 
        nameKey: 'voiceStudio.voices.central.hatinh_female', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'central', 
        icon: 'fas fa-sun',
        provinceKey: 'hatinh',
        stylePrompt: "Đọc bằng giọng nữ Hà Tĩnh, mộc mạc, chân thành, có chút nặng tình, ngữ điệu lên xuống đặc trưng của vùng 'chảo lửa túi mưa'."
    },
    { 
        id: 'quangbinh_male', 
        nameKey: 'voiceStudio.voices.central.quangbinh_male', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'central', 
        icon: 'fas fa-wind',
        provinceKey: 'quangbinh',
        stylePrompt: "Đọc bằng giọng nam Quảng Bình, rắn rỏi, mạnh mẽ như gió lào cát trắng, âm vực rộng và vang."
    },
    { 
        id: 'danang_male', 
        nameKey: 'voiceStudio.voices.central.danang_male', 
        geminiVoice: 'Zephyr', 
        gender: 'male', 
        regionKey: 'central', 
        icon: 'fas fa-building',
        provinceKey: 'danang',
        stylePrompt: "Đọc bằng giọng nam Đà Nẵng, sôi nổi, thân thiện, tốc độ vừa phải, ngữ điệu vui vẻ, cởi mở và hiện đại."
    },
    { 
        id: 'quangtri_male', 
        nameKey: 'voiceStudio.voices.central.quangtri_male', 
        geminiVoice: 'Charon', 
        gender: 'male', 
        regionKey: 'central', 
        icon: 'fas fa-history',
        provinceKey: 'quangtri',
        stylePrompt: "Đọc bằng giọng nam Quảng Trị, chân chất, thật thà, giọng nói đậm đà, mang nét khắc khổ nhưng kiên cường."
    },
    { 
        id: 'binhdinh_female', 
        nameKey: 'voiceStudio.voices.central.binhdinh_female', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'central', 
        icon: 'fas fa-fist-raised',
        provinceKey: 'binhdinh',
        stylePrompt: "Đọc bằng giọng nữ Bình Định (xứ Nẫu), mạnh mẽ, nhanh nhẹn, dứt khoát như con nhà võ, nhưng vẫn có nét duyên dáng."
    },

    // --- MIỀN NAM (SOUTH) ---
    { 
        id: 'saigon_female_20', 
        nameKey: 'voiceStudio.voices.south.saigon_female_chic', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'south', 
        icon: 'fas fa-cocktail',
        provinceKey: 'saigon',
        stylePrompt: "Đọc bằng giọng nữ Sài Gòn, ngọt ngào, dễ thương, hơi nũng nịu, sang chảnh, giống một cô gái 20 tuổi năng động và thời thượng."
    },
    { 
        id: 'saigon_male_vlog', 
        nameKey: 'voiceStudio.voices.south.saigon_male_vlog', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'south', 
        icon: 'fas fa-camera',
        provinceKey: 'saigon',
        stylePrompt: "Đọc bằng giọng nam Sài Gòn làm Vlog, phóng khoáng, tự tin, sảng khoái, tốc độ nhanh, hào hứng, lôi cuốn người nghe."
    },
    { 
        id: 'cantho_female', 
        nameKey: 'voiceStudio.voices.south.cantho_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'south', 
        icon: 'fas fa-water',
        provinceKey: 'cantho',
        stylePrompt: "Đọc bằng giọng con gái miền Tây (Cần Thơ), ngọt như mía lùi, êm ái, kéo dài âm cuối, nghe rất lọt tai và dịu dàng."
    },
    { 
        id: 'camau_male', 
        nameKey: 'voiceStudio.voices.south.camau_male', 
        geminiVoice: 'Charon', 
        gender: 'male', 
        regionKey: 'south', 
        icon: 'fas fa-ship',
        provinceKey: 'camau',
        stylePrompt: "Đọc bằng giọng nam Cà Mau (đất mũi), hào sảng, chân chất, âm vực rộng, đậm chất sông nước miền Tây Nam Bộ."
    },
    { 
        id: 'vinhlong_female_story', 
        nameKey: 'voiceStudio.voices.south.vinhlong_female_story', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'south', 
        icon: 'fas fa-book-reader',
        provinceKey: 'vinhlong',
        stylePrompt: "Đọc bằng giọng nữ Vĩnh Long kể chuyện đời xưa, chậm rãi, trầm ấm, có độ ngân nga, gợi cảm giác hoài cổ."
    },
    { 
        id: 'bentre_male', 
        nameKey: 'voiceStudio.voices.south.bentre_male', 
        geminiVoice: 'Zephyr', 
        gender: 'male', 
        regionKey: 'south', 
        icon: 'fas fa-tree',
        provinceKey: 'bentre',
        stylePrompt: "Đọc bằng giọng nam Bến Tre, hiền lành, thật thà, giọng nói đều đều, tạo cảm giác tin cậy và gần gũi."
    },
    { 
        id: 'dongthap_female', 
        nameKey: 'voiceStudio.voices.south.dongthap_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'south', 
        icon: 'fas fa-spa',
        provinceKey: 'dongthap',
        stylePrompt: "Đọc bằng giọng nữ Đồng Tháp, nhẹ nhàng như hương sen, thanh thoát, mộc mạc nhưng tinh tế."
    },
    { 
        id: 'vungtau_male', 
        nameKey: 'voiceStudio.voices.south.vungtau_male', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'south', 
        icon: 'fas fa-umbrella-beach',
        provinceKey: 'vungtau',
        stylePrompt: "Đọc bằng giọng nam Vũng Tàu, hiện đại, lai giữa giọng Sài Gòn và giọng biển, thoải mái và tự nhiên."
    },

    // --- CHUYÊN BIỆT (SPECIAL) ---
    { 
        id: 'ad_male_promo', 
        nameKey: 'voiceStudio.voices.special.ad_male_promo', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'special', 
        icon: 'fas fa-bullhorn',
        provinceKey: 'promo',
        stylePrompt: "Đọc bằng giọng nam MC quảng cáo (TVC), năng lượng bùng nổ, dứt khoát, hào hứng, nhấn mạnh vào các từ khóa, thúc đẩy hành động."
    },
    { 
        id: 'ad_female_sales', 
        nameKey: 'voiceStudio.voices.special.ad_female_sales', 
        geminiVoice: 'Kore', 
        gender: 'female', 
        regionKey: 'special', 
        icon: 'fas fa-shopping-bag',
        provinceKey: 'promo',
        stylePrompt: "Đọc bằng giọng nữ Livestream bán hàng, nhanh, liến thoắng, vui vẻ, thân thiện, kêu gọi chốt đơn liên tục."
    },
    { 
        id: 'story_male_old', 
        nameKey: 'voiceStudio.voices.special.story_male_old', 
        geminiVoice: 'Charon', 
        gender: 'male', 
        regionKey: 'special', 
        icon: 'fas fa-book',
        provinceKey: 'promo',
        stylePrompt: "Đọc bằng giọng nam già, trầm, khàn, chậm rãi, giống như một người ông đang kể chuyện cổ tích cho cháu nghe, đầy trải nghiệm."
    },
    { 
        id: 'kid_boy_cute', 
        nameKey: 'voiceStudio.voices.special.kid_boy', 
        geminiVoice: 'Zephyr', 
        gender: 'male', 
        regionKey: 'special', 
        icon: 'fas fa-child',
        provinceKey: 'kid',
        stylePrompt: "Đọc bằng giọng bé trai 6 tuổi (giọng trẻ con, cao, sáng), ngây thơ, trong sáng, lanh lợi, hơi ngọng nghịu một chút."
    },
    { 
        id: 'kid_girl_cute', 
        nameKey: 'voiceStudio.voices.special.kid_girl', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'special', 
        icon: 'fas fa-female',
        provinceKey: 'kid',
        stylePrompt: "Đọc bằng giọng bé gái 5 tuổi (giọng trẻ con, cao, trong vắt), điệu đà, nũng nịu, dễ thương như công chúa nhỏ."
    },

    // --- QUỐC TẾ (INTERNATIONAL) ---
    { 
        id: 'us_male_news', 
        nameKey: 'voiceStudio.voices.intl.us_male', 
        geminiVoice: 'Fenrir', 
        gender: 'male', 
        regionKey: 'intl', 
        icon: 'fas fa-flag-usa',
        provinceKey: 'us',
        stylePrompt: "Speak in a standard American male news anchor voice, professional, deep, authoritative, and clear."
    },
    { 
        id: 'us_female_soft', 
        nameKey: 'voiceStudio.voices.intl.us_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'intl', 
        icon: 'fas fa-flag-usa',
        provinceKey: 'us',
        stylePrompt: "Speak in a soft, friendly American female voice, conversational and approachable."
    },
    { 
        id: 'uk_male_posh', 
        nameKey: 'voiceStudio.voices.intl.uk_male', 
        geminiVoice: 'Zephyr', 
        gender: 'male', 
        regionKey: 'intl', 
        icon: 'fas fa-crown',
        provinceKey: 'uk',
        stylePrompt: "Speak in a Posh British male voice (Received Pronunciation), elegant, sophisticated, and articulate."
    },
    { 
        id: 'uk_female_posh', 
        nameKey: 'voiceStudio.voices.intl.uk_female', 
        geminiVoice: 'Aoede', 
        gender: 'female', 
        regionKey: 'intl', 
        icon: 'fas fa-crown',
        provinceKey: 'uk',
        stylePrompt: "Speak in a Posh British female voice (Received Pronunciation), elegant, sophisticated, polite, and articulate."
    }
];

// --- OTHER CONSTANTS ---

export const DEFAULT_SETTINGS: Settings = {
  aspectRatio: '3x4',
  outfit: {
    mode: 'preset',
    preset: 'Sơ mi trắng', // Use key instead of Vietnamese text
    customPrompt: '',
    uploadedFile: null,
    keepOriginal: false,
  },
  face: {
    otherCustom: '',
    hairStyle: 'auto',
    keepOriginalFeatures: true,
    smoothSkin: false,
    slightSmile: false,
  },
  background: {
    mode: 'light_blue',
    customColor: '#e0e8f0', // Standard blue
    customPrompt: '',
  },
  safe5x5Layout: true,
  printLayout: 'none',
  paperBackground: '#ffffff',
  highQuality: false, // Default to standard/fast quality
};

export const OUTFIT_PRESETS = [
    { nameKey: 'outfits.white_shirt', value: 'Sơ mi trắng', icon: 'fas fa-shirt', category: 'somi', previewUrl: 'https://lh3.googleusercontent.com/d/12V-djiwtgB6uk1aIj06exKzeQrkedaW_' },
    { nameKey: 'outfits.blue_shirt', value: 'Sơ mi xanh', icon: 'fas fa-shirt', category: 'somi', previewUrl: 'https://lh3.googleusercontent.com/d/157-yjF1xs64mUVhGAqnJ2oBSX_ASSoTy' },
    { nameKey: 'outfits.plaid_shirt', value: 'Sơ mi caro', icon: 'fas fa-shirt', category: 'somi', previewUrl: 'https://lh3.googleusercontent.com/d/1qiJWsy2xy6yKePyYwvhirZv92EdAiuD8' },
    { nameKey: 'outfits.black_vest', value: 'Vest đen nam', icon: 'fas fa-user-tie', category: 'vest', previewUrl: 'https://lh3.googleusercontent.com/d/1__54QVkyieN44H3Ro23gQHtvtAOI2-iQ' },
    { nameKey: 'outfits.navy_vest', value: 'Vest xanh navy nam', icon: 'fas fa-user-tie', category: 'vest', previewUrl: 'https://lh3.googleusercontent.com/d/194P1MH7PiAggGJJ4FtMr4cb8SVqVFJB8' },
    { nameKey: 'outfits.gray_vest', value: 'Vest xám nam', icon: 'fas fa-user-tie', category: 'vest', previewUrl: 'https://lh3.googleusercontent.com/d/1_lt8XlNe2MnbZXKnJE2tWrWg66QvVxMq' },
    { nameKey: 'outfits.womens_black_vest', value: 'Vest nữ đen', icon: 'fas fa-user-tie', category: 'vest', previewUrl: 'https://lh3.googleusercontent.com/d/1ceZLDR5lGw7hf50lf8eEfMzMelPQufw6' },
    { nameKey: 'outfits.womens_white_vest', value: 'Vest nữ trắng', icon: 'fas fa-user-tie', category: 'vest', previewUrl: 'https://lh3.googleusercontent.com/d/1gLQFZGwJxlJzmJ7dODELpoYhaSZuKhQ-' },
    { nameKey: 'outfits.white_aodai', value: 'Áo dài trắng', icon: 'fas fa-person-dress', category: 'aodai', previewUrl: 'https://lh3.googleusercontent.com/d/1OuXIH8CVcfFHK0mteaWbxTmZ3U8V1A2I' },
    { nameKey: 'outfits.pink_aodai', value: 'Áo dài hồng', icon: 'fas fa-person-dress', category: 'aodai', previewUrl: 'https://lh3.googleusercontent.com/d/1dSZJTpZP7J0WD59uUVdIewzMd-4SgxEC' },
    { nameKey: 'outfits.polo_shirt', value: 'Áo polo', icon: 'fas fa-tshirt', category: 'khac', previewUrl: 'https://lh3.googleusercontent.com/d/1UsYQDSNRO9_0E1AkcZ26TeY2yyUca_a3' },
    { nameKey: 'outfits.womens_blouse', value: 'Áo blouse nữ trắng', icon: 'fas fa-person-dress', category: 'khac', previewUrl: 'https://lh3.googleusercontent.com/d/1hentzczqTGyjHQHmaKerrV0ShBcOQRmK' },
];


export const ASPECT_RATIO_MAP: { [key: string]: number } = {
    '2x3': 2 / 3,
    '3x4': 3 / 4,
    '4x6': 4 / 6,
    '5x5': 1,
};

export const PAPER_ASPECT_RATIO_MAP: { [key: string]: number } = {
    '10x15': 10 / 15,
    '13x18': 13 / 18,
    '20x30': 20 / 30,
};

// Physical photo sizes in millimeters for print layout calculations.
export const PHOTO_SIZES_MM: Record<AspectRatio, {width:number, height:number}> = {
    '2x3': { width: 20, height: 30 },
    '3x4': { width: 30, height: 40 },
    '4x6': { width: 40, height: 60 },
    '5x5': { width: 50, height: 50 },
};


export const PRINT_LAYOUT_CONFIG = {
    '10x15': { label: 'Khổ 10x15 cm', grid: [3, 3], size: [10, 15] }, // cm
    '13x18': { label: 'Khổ 13x18 cm', grid: [4, 4], size: [13, 18] },
    '20x30': { label: 'Khổ 20x30 cm', grid: [6, 7], size: [20, 30] },
};

export const HEADSHOT_STYLES: HeadshotStyle[] = [
    {
        id: 'corporate',
        nameKey: 'headshotStyles.corporate',
        type: 'professional',
        prompt: 'A professional corporate headshot, studio lighting, sharp focus on the person, slightly blurred solid background (light gray or blue), person is wearing a business suit.'
    },
    {
        id: 'artistic',
        nameKey: 'headshotStyles.artistic',
        type: 'artistic',
        prompt: 'An artistic, creative headshot. Dramatic lighting (chiaroscuro or Rembrandt lighting), textured background, expressive and thoughtful look, high contrast.'
    },
    {
        id: 'outdoor',
        nameKey: 'headshotStyles.outdoor',
        type: 'outdoor',
        prompt: 'An outdoor headshot, taken during the golden hour with soft, natural light. The background is a pleasingly blurred natural environment (park, modern architecture). The person has a relaxed, friendly expression.'
    },
    {
        id: 'minimalist',
        nameKey: 'headshotStyles.minimalist',
        type: 'minimalist',
        prompt: 'A minimalist headshot with a clean, simple, solid-colored background (off-white or pastel). Bright, even lighting. The focus is entirely on the person\'s face and expression. Simple, modern clothing.'
    }
];

export const INITIAL_CLEAN_PROMPT = `
Thực hiện một bước phục chế sơ bộ trên hình ảnh này. Mục tiêu chính là làm rõ các đường viền và chi tiết khuôn mặt, cân bằng lại các mảng tối và giảm độ nhòe của nền. 
QUAN TRỌNG: KHÔNG xóa hết các vết xước hoặc vết mốc. Chỉ thực hiện một lần làm sạch nhẹ nhàng để chuẩn bị cho các bước phục chế sâu hơn. Giữ lại phần lớn các khuyết điểm nhỏ để duy trì cảm giác chân thực.
`;

export const ADVANCED_RESTORATION_PROMPT = `
Bạn là một chuyên gia AI phục chế ảnh cũ. Hãy tuân thủ nghiêm ngặt quy trình (pipeline) sau đây để phục chế hình ảnh được cung cấp. Ưu tiên tuyệt đối là BẢO TOÀN DANH TÍNH của người trong ảnh.

**A) QUY TRINI PHỤC CHẾ:**

1.  **Tiền xử lý hư hỏng:**
    *   **Cân bằng màu & tương phản:** Áp dụng cân bằng trắng (white balance) và điều chỉnh nhẹ tone curve.
    *   **Khử nấm/mốc & ố vàng:** Sử dụng inpainting và texture synthesis dựa trên vùng bị hỏng.
    *   **Giảm nhiễu & khối JPEG:** Dùng các thuật toán cao cấp để khử nhiễu và artifact nén JPEG.

2.  **Phục hồi cấu trúc tổng thể:**
    *   **Khử mờ (Deblur):** Áp dụng thuật toán deblur để khắc phục mờ do chuyển động hoặc lấy nét sai.
    *   **Siêu phân giải (Super-Resolution):** Tăng cường chi tiết cho hậu cảnh và trang phục.

3.  **Phục hồi gương mặt (Bảo toàn danh tính):**
    *   **QUAN TRỌNG NHẤT:** Phát hiện và căn chỉnh khuôn mặt. Sử dụng các mô hình phục hồi khuôn mặt chất lượng cao với cường độ vừa phải để tránh hiệu ứng "mặt búp bê", mất tự nhiên.
    *   **KHÓA DANH TÍNH:** Khuôn mặt sau khi phục chế PHẢI là của cùng một người. Không thay đổi cấu trúc khuôn mặt.

4.  **Inpaint vết rách/xước:**
    *   Sử dụng inpainting nhận biết ngữ cảnh (context-aware) để lấp các vết rách/xước còn lại.

5.  **Tinh chỉnh cuối cùng:**
    *   **Làm sắc nét có chọn lọc:** Chỉ làm sắc nét các chi tiết quan trọng: mắt, lông mi, viền môi.
    *   **Tăng tương phản vi mô (Micro-contrast):** Tăng nhẹ tương phản ở các vùng cấu trúc mặt.
    *   **Thêm nhiễu hạt (Grain):** Nếu ảnh trông quá "sạch" và giả, hãy thêm một lớp nhiễu hạt phim rất nhẹ để tạo cảm giác chân thực, cổ điển.

**THỨ TỰ THỰC HIỆN:** Tuân thủ nghiêm ngặt thứ tự sau: Giảm nhiễu → Khử mờ → Siêu phân giải nền → Phục hồi mặt → Inpaint → Tinh chỉnh màu/độ nét. Giữ nguyên ảnh đen trắng gốc.

Hãy áp dụng quy trình này để phục chế hình ảnh tôi đã cung cấp.
`;

export const COLORIZATION_PROMPT = `
Bạn là một chuyên gia AI tô màu ảnh. Hãy tô màu cho bức ảnh đen trắng đã được phục chế mà tôi cung cấp. Mục tiêu là tạo ra một bức ảnh chân dung chất lượng cao, trông như mới được chụp trong thời đại xưa, giữ được nét cổ điển nhưng với độ trong và ấm áp. Hãy tuân thủ nghiêm ngặt các yêu cầu sau:

- **Chất lượng tổng thể:** Phục dựng ảnh gần như mới hoàn toàn, giống như một bức chân dung chụp mới từ thập niên xưa.
- **Gương mặt:** Làm cho gương mặt hai nhân vật rõ nét, tự nhiên, mắt sáng, và da mịn màng nhưng vẫn giữ được kết cấu da thật. Tuyệt đối BẢO TOÀN DANH TÍNH.
- **Màu sắc:** Áp dụng một tông màu ấm hơn (sepia tone) cho toàn bộ ảnh để tạo cảm giác cổ điển, hoài niệm.
- **Hậu cảnh và chi tiết:** Đảm bảo nền ảnh nhẵn mịn không còn vết xước. Áo, tóc, và các phụ kiện (ví dụ: khăn ren, quân phục) phải đều sắc nét, khôi phục chi tiết gần như nguyên bản.
- **Phong cách:** Kết hợp giữa nét cổ điển và sự rõ ràng, sắc nét của ảnh hiện đại.

Hãy tiến hành tô màu cho bức ảnh.
`;

export const PIPELINE_STEPS = [
    "pipelineSteps.initial",
    "pipelineSteps.advanced",
    "pipelineSteps.finalize",
    "pipelineSteps.complete",
];

// Replaced with keys for i18n
export const RESULT_STAGES_KEYS = [
    "resultStages.original",
    "resultStages.step1",
    "resultStages.step2",
    "resultStages.step3"
];

// ... rest of constants
export const FASHION_FEMALE_STYLES: FashionStyle[] = [
    { key: "fashionStyles.female.luxury_vest", promptValue: "Vest nữ tỷ đô sang trọng" },
    { key: "fashionStyles.female.evening_gown", promptValue: "Váy dạ hội tỷ đô đẳng cấp" },
    // ... all existing fashion styles ...
    { key: "fashionStyles.female.a_line_skirt", promptValue: "Chân váy chữ A" }
];
export const FASHION_MALE_STYLES: FashionStyle[] = [
    { key: "fashionStyles.male.classic_white_shirt", promptValue: "Áo sơ mi trắng cổ điển" },
    // ... all existing male styles ...
    { key: "fashionStyles.male.sweater", promptValue: "Áo sweater nam" }
];
export const FASHION_GIRL_STYLES: FashionStyle[] = [
    { key: "fashionStyles.girl.princess_tshirt", promptValue: "Áo thun cotton in hình công chúa" },
    // ... all existing girl styles ...
    { key: "fashionStyles.girl.cute_backpack", promptValue: "Ba lô dễ thương" }
];
export const FASHION_BOY_STYLES: FashionStyle[] = [
    { key: "fashionStyles.boy.plain_cotton_tshirt", promptValue: "Áo thun cotton trơn" },
    // ... all existing boy styles ...
    { key: "fashionStyles.boy.crossbody_bag", promptValue: "Túi chéo nhỏ bé trai" }
];

export const FASHION_ASPECT_RATIOS: { value: FashionAspectRatio, labelKey: string }[] = [
  { value: "1:1", labelKey: "fashionAspectRatios.square" },
  { value: "4:3", labelKey: "fashionAspectRatios.portrait" },
  { value: "9:16", labelKey: "fashionAspectRatios.story" },
  { value: "16:9", labelKey: "fashionAspectRatios.landscape" }
];

export const DEFAULT_FASHION_STUDIO_SETTINGS: {
    category: 'female',
    style: string,
    aspectRatio: '4:3',
    description: string,
    highQuality: boolean
} = {
    category: 'female',
    style: FASHION_FEMALE_STYLES[0].promptValue,
    aspectRatio: '4:3',
    description: '',
    highQuality: false, // Default to standard/fast quality
};

// --- Marketing Studio Constants ---

export const MARKETING_TEMPLATES: TemplateOption[] = [
  { id: "hero_studio", labelKey: "marketingStudio.templates.hero_studio", phrase: "Clean hero studio shot on seamless backdrop, premium softbox lighting, subtle reflection base, minimal composition" },
  { id: "lifestyle_inuse", labelKey: "marketingStudio.templates.lifestyle_inuse", phrase: "Lifestyle scene showing real usage, natural window light, soft depth of field, candid hands interacting with the product" },
  { id: "exploded_features", labelKey: "marketingStudio.templates.exploded_features", phrase: "Semi-exploded view highlighting components and key features, neat floating callouts, balanced symmetric layout" },
  { id: "comparison", labelKey: "marketingStudio.templates.comparison", phrase: "Comparison layout with side-by-side panels, clear visual difference, consistent camera angle, tidy spacing" },
  { id: "unboxing", labelKey: "marketingStudio.templates.unboxing", phrase: "Unboxing scene with box and accessories neatly arranged, overhead top-down shot, tidy grid composition" },
  { id: "tet_holiday", labelKey: "marketingStudio.templates.tet_holiday", phrase: "Vietnamese Lunar New Year theme, red and gold accents, apricot and peach blossoms in background, festive atmosphere" },
  { id: "luxury_black", labelKey: "marketingStudio.templates.luxury_black", phrase: "Luxury product photography on black background, golden rim lighting, elegant reflections, premium feel" },
  { id: "nature_eco", labelKey: "marketingStudio.templates.nature_eco", phrase: "Natural setting with green leaves, wood textures, sunlight dappling, eco-friendly vibe" }
];

export const MARKETING_TONES: SelectOption[] = [
  { id: "honest", labelKey: "marketingStudio.tones.honest" },
  { id: "professional", labelKey: "marketingStudio.tones.professional" },
  { id: "enthusiastic", labelKey: "marketingStudio.tones.enthusiastic" },
  { id: "luxury", labelKey: "marketingStudio.tones.luxury" },
  { id: "witty", labelKey: "marketingStudio.tones.witty" },
  { id: "emotional", labelKey: "marketingStudio.tones.emotional" }
];

export const MARKETING_ANGLES: string[] = [
  "key benefits: battery life, build quality, portability",
  "value for money, what’s included in the box, who it’s for",
  "material & finish, ergonomics, reliability",
  "performance numbers (claims vs observed), pros / cons summary",
  "brand trust, warranty, after-sales support",
  "top 3 features visualized with icons/markers",
];
