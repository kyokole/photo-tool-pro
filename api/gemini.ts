// FIX: Removed triple-slash directive for 'node' as it causes errors in environments where @types/node is not present (like the testing environment).
// The 'Buffer' type is declared as 'any' below as a fallback.
// Fallback cho môi trường không có @types/node (Google AI Studio, editor).
declare const Buffer: any;

// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
// It has been made self-contained to prevent Vercel bundling issues.
// NOTE: Use global Buffer from Node, do NOT import from 'node:buffer' to avoid generic type conflicts.
// FIX: Remove incorrect 'Blob' import and only use 'Part' for response data.
// FIX: Import GenerateContentResponse to correctly type Gemini API responses.
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import sharp from 'sharp';


// --- MERGED TYPES from types.ts ---
// These types are included directly to make this file self-contained.
type AspectRatio = '2x3' | '3x4' | '4x6' | '5x5';
type FashionAspectRatio = '1:1' | '4:3' | '9:16' | '16:9';
type OutfitMode = 'preset' | 'custom' | 'upload';
type HairStyle = 'auto' | 'down' | 'slicked_back' | 'keep_original';
type BackgroundMode = 'white' | 'light_blue' | 'custom' | 'ai';
type PrintLayout = 'none' | '10x15' | '13x18' | '20x30';
type PaperBackground = 'white' | 'gray';
interface RestorationOptions {
  restorationLevel: number;
  removeScratches: boolean;
  colorize: boolean;
  faceEnhance: boolean;
  gender: 'auto' | 'male' | 'female';
  age: 'auto' | 'child' | 'young_adult' | 'adult' | 'elderly';
  context: string;
}
interface Settings {
  aspectRatio: AspectRatio;
  outfit: {
    mode: OutfitMode;
    preset: string;
    customPrompt: string;
    uploadedFile: any; // Simplified for server-side
    keepOriginal: boolean;
  };
  face: {
    otherCustom: string;
    hairStyle: HairStyle;
    keepOriginalFeatures: boolean;
    smoothSkin: boolean;
    slightSmile: boolean;
  };
  background: {
    mode: BackgroundMode;
    customColor: string;
    customPrompt: string;
  };
  safe5x5Layout: boolean;
  printLayout: PrintLayout;
  paperBackground: PaperBackground;
}
type FashionCategory = 'female' | 'male' | 'girl' | 'boy';
interface FashionStudioSettings {
  category: FashionCategory;
  style: string;
  aspectRatio: FashionAspectRatio;
  description: string;
  highQuality: boolean;
}

// Tách bạch ROI theo % và ROI pixel
interface ROIPercentage { memberId: string; xPct: number; yPct: number; wPct: number; hPct: number; }
interface ROIAbsolute   { memberId: string; x: number; y: number; w: number; h: number; }

interface SerializedFamilyMember {
    id: string;
    age: string;
    photo: {
        base64: string;
        mimeType: string;
    };
    bodyDescription?: string;
    outfit?: string;
    pose?: string;
}

// Hợp đồng FE -> BE: rois là phần trăm
interface SerializedFamilyStudioSettings {
  members: SerializedFamilyMember[];
  scene: string;
  outfit: string;
  pose: string;
  customPrompt: string;
  aspectRatio: '4:3' | '16:9';
  faceConsistency: boolean;
  rois: ROIPercentage[];
}

interface Scene {
  title: string;
  desc: string;
}
type FootballMode = 'idol' | 'outfit';
type FootballCategory = 'contemporary' | 'legendary';
interface FootballStudioSettings {
  mode: FootballMode;
  sourceImage: any; // Simplified for server-side
  category: FootballCategory;
  team: string;
  player: string;
  scene: string;
  aspectRatio: string;
  style: string;
  customPrompt: string;
}
export enum FeatureAction {
  PRODUCT_PHOTO = 'product_photo',
  TRY_ON_OUTFIT = 'try_on_outfit',
  PLACE_IN_SCENE = 'place_in_scene',
  COUPLE_COMPOSE = 'couple_compose',
  FASHION_STUDIO = 'fashion_studio',
  EXTRACT_OUTFIT = 'extract_outfit',
  CHANGE_HAIRSTYLE = 'change_hairstyle',
  CREATE_ALBUM = 'create_album',
  CREATIVE_COMPOSITE = 'creative_composite',
  BIRTHDAY_PHOTO = 'birthday_photo',
  HOT_TREND_PHOTO = 'hot_trend_photo',
  AI_TRAINER = 'ai_trainer',
  ID_PHOTO = 'id_photo',
  AI_THUMBNAIL_DESIGNER = 'ai_thumbnail_designer',
  BATCH_GENERATOR = 'batch_generator',
  IMAGE_VARIATION_GENERATOR = 'image_variation_generator',
  KOREAN_STYLE_STUDIO = 'korean_style_studio',
  YOGA_STUDIO = 'yoga_studio',
}

// Simplified types for Beauty Studio, just what's needed for prompt generation
interface BeautyStyle {
  id: string;
  englishLabel: string;
  promptInstruction?: string;
}
interface BeautySubFeature {
  englishLabel: string;
  promptInstruction?: string;
}
interface BeautyFeature {
  englishLabel: string;
  promptInstruction?: string;
}

// --- MERGED CONSTANTS from constants.ts ---
const ASPECT_RATIO_MAP: { [key: string]: number } = {
    '2x3': 2 / 3,
    '3x4': 3 / 4,
    '4x6': 4 / 6,
    '5x5': 1,
};

const HIDDEN_ADDONS: string = [
  "Thần thái K-fashion hiện đại, sang trọng, dáng mềm mại, tinh tế",
  "Chất lượng ảnh cao cấp: ánh sáng điện ảnh Hàn Quốc, chi tiết 8K, xử lý bề mặt vải và tóc tinh xảo, màu sắc tinh gọn.",
  "Giữ nguyên khuôn mặt tham chiếu (Face Consistency)",
].join(", ");


// --- MERGED PROMPTS from _serverSidePrompts.ts ---
const createFinalPromptVn = (userRequest: string, useFaceLock: boolean, isCouple: boolean = false, gender1?: string, gender2?: string): string => {
    const qualityBooster = "\n\n**CHỈ THỊ CHẤT LƯỢNG:** Ảnh cuối cùng phải là một tuyệt tác siêu thực (photorealistic masterpiece), chất lượng 8K, với các chi tiết siêu nét (hyper-detailed), kết cấu tự nhiên và ánh sáng điện ảnh.";
    
    if (!useFaceLock) {
        return `**NHIỆM VỤ:** Tạo một bức ảnh nghệ thuật, chất lượng cao dựa trên yêu cầu của người dùng.\n\n**YÊU CẦU (Tiếng Việt):** ${userRequest}${qualityBooster}`;
    }

    let identityDescription = "Ảnh đầu tiên được cung cấp là ảnh THAM CHIẾU NHẬN DẠNG.";
    if (isCouple) {
        const g1_vn = gender1 === 'male' ? 'một người Nam' : gender1 === 'female' ? 'một người Nữ' : 'một người';
        const g2_vn = gender2 === 'male' ? 'một người Nam' : gender2 === 'female' ? 'một người Nữ' : 'một người';
        identityDescription = `Ảnh ĐẦU TIÊN là NHẬN DẠNG_NGƯỜI_1 (${g1_vn}, bên trái). Ảnh THỨ HAI là NHẬN DẠNG_NGƯỜI_2 (${g2_vn}, bên phải).`;
    }

    return `**CHỈ THỊ TỐI THƯỢỢNG: BẢO TOÀN NHẬN DẠNG**
**MỤC TIÊU CHÍNH:** Nhiệm vụ quan trọng nhất của bạn là tạo ra một hình ảnh trong đó (các) khuôn mặt của (những) người là một **BẢN SAO HOÀN HẢO, KHÔNG TÌ VẾT, GIỐNG HỆT** với (các) khuôn mặt từ (những) ảnh THAM CHIẾU NHẬN DẠNG.
**QUY TẮC BẤT DI BẤT DỊCH:**
1.  **NGUỒN NHẬN DẠNG:** ${identityDescription}
2.  **SAO CHÉP KHUÔN MẶT:** (Các) khuôn mặt trong ảnh cuối cùng **PHẢI LÀ BẢN SAO CHÍNH XÁC 1:1**. KHÔNG được thay đổi cấu trúc khuôn mặt, các đường nét, biểu cảm, hoặc kết cấu da.
3.  **YÊU CẦU NGƯỜI DÙNG:** Thực hiện yêu cầu của người dùng dưới đây, nhưng **CHỈ SAU KHI** đã thỏa mãn tất cả các quy tắc bảo toàn nhận dạng.
---
**YÊU CẦU (Tiếng Việt):**
${userRequest}
---
${qualityBooster}
**KIỂM TRA CUỐI CÙNG:** Trước khi tạo ảnh, hãy xác nhận kế hoạch của bạn bao gồm việc sao chép hoàn hảo (các) khuôn mặt nhận dạng.`;
};

const createFinalPromptEn = (userRequest: string, useFaceLock: boolean, isCouple: boolean = false, gender1?: string, gender2?: string): string => {
    const qualityBooster = "\n\n**QUALITY DIRECTIVE:** The final image must be a photorealistic masterpiece, 8K, with hyper-detailed textures and cinematic lighting.";

    if (!useFaceLock) {
        return `**TASK:** Create a high-quality, artistic image based on the user's request.\n\n**USER REQUEST:** ${userRequest}${qualityBooster}`;
    }

    let identityDescription = "The first image provided is the IDENTITY REFERENCE.";
    if (isCouple) {
        const g1_en = gender1 === 'male' ? 'a Male' : gender1 === 'female' ? 'a Female' : 'a person';
        const g2_en = gender2 === 'male' ? 'a Male' : gender2 === 'female' ? 'a Female' : 'a person';
        identityDescription = `The FIRST image is IDENTITY_PERSON_1 (${g1_en}, on the left). The SECOND image is IDENTITY_PERSON_2 (${g2_en}, on the right).`;
    }

    return `**ULTIMATE DIRECTIVE: IDENTITY PRESERVATION**
**PRIMARY GOAL:** Your most critical task is to generate an image where the subject's face is a **FLAWLESS, IDENTICAL, 1:1 REPLICA** of the face from the IDENTITY REFERENCE image(s).
**NON-NEGOTIABLE RULES:**
1.  **IDENTITY SOURCE:** ${identityDescription}
2.  **FACE REPLICATION:** The face in the final output **MUST BE AN EXACT COPY**. Do not alter facial structure, features (eyes, nose, lips), expression, or skin texture. This is more important than any other part of the prompt.
3.  **SCENE GENERATION:** Execute the user's scene description below, but **ONLY AFTER** you have satisfied all identity preservation rules.
---
**USER SCENE DESCRIPTION:**
${userRequest}
---
${qualityBooster}
**FINAL CHECK:** Before rendering, confirm your plan includes perfectly replicating the identity face. The scene is secondary to face consistency.`;
};

const buildIdPhotoPrompt = (settings: Settings): string => {
    let prompt = `**Bước tiền xử lý quan trọng: Cắt ảnh chân dung trong đầu**
Trước mọi chỉnh sửa khác, bạn PHẢI phân tích ảnh gốc. Nếu đó là ảnh góc rộng, ảnh phong cảnh, hoặc chứa nhiều hậu cảnh, nhiệm vụ đầu tiên của bạn là cắt ảnh trong đầu thành một bức chân dung tiêu chuẩn từ đầu đến vai. Chỉ tập trung vào đầu và phần thân trên của chủ thể chính. Loại bỏ tất cả các yếu tố cảnh quan khác. Tất cả các chỉnh sửa tiếp theo (nền, quần áo, v.v.) sẽ CHỈ được thực hiện trên khu vực chân dung đã cắt trong đầu này. Điều này đảm bảo đầu ra cuối cùng là một bức chân dung đúng nghĩa, không phải là một hình người nhỏ trong một khung hình lớn.

Hãy đóng vai một biên tập viên ảnh chuyên nghiệp. Nhiệm vụ của bạn là thực hiện các chỉnh sửa chất lượng cao trên một bức chân dung do người dùng cung cấp.
Làm theo các hướng dẫn cụ thể về nền, quần áo và điều chỉnh khuôn mặt dưới đây. Đảm bảo ánh sáng chuyên nghiệp và kết cấu da tự nhiên.
`;

    if (settings.background.mode === 'ai' && settings.background.customPrompt.trim() !== '') {
        prompt += `
**1. Thay nền AI:**
- Thay thế nền gốc bằng một cảnh thực tế được mô tả là: "${settings.background.customPrompt}".
- Nền được tạo PHẢI trông chuyên nghiệp và phù hợp với một bức chân dung.
- **Quan trọng**, áp dụng hiệu ứng làm mờ đáng kể (hiệu ứng bokeh) cho nền để đảm bảo người vẫn là tiêu điểm rõ ràng.
- Ánh sáng, bóng đổ và nhiệt độ màu của nền mới phải hoàn toàn khớp với ánh sáng trên khuôn mặt và tóc của người từ ảnh gốc.
- Việc phát hiện cạnh xung quanh tóc và vai phải hoàn hảo và liền mạch. Tạo một mặt nạ sạch, sắc nét không có hiệu ứng hào quang hoặc loang màu.
`;
    } else {
        prompt += `
**1. Thay nền:**
- Thay thế hoàn toàn nền gốc bằng một màu đồng nhất: ${settings.background.mode === 'custom' ? settings.background.customColor : (settings.background.mode === 'white' ? '#FFFFFF' : '#E0E8F0')}.
- Việc phát hiện cạnh xung quanh tóc và vai phải hoàn hảo. Tạo một mặt nạ sạch, sắc nét không có hiệu ứng hào quang hoặc loang màu.
`;
    }
    
    if (settings.outfit.mode === 'upload') {
        prompt += `
**2. Chỉnh sửa trang phục (từ ảnh):**
- Bạn đã được cung cấp hai hình ảnh. Hình ảnh đầu tiên là tham chiếu quần áo, và hình ảnh thứ hai là người cần chỉnh sửa.
- Mặc cho người từ hình ảnh thứ hai bộ quần áo từ hình ảnh đầu tiên một cách thực tế và liền mạch.
- Trang phục mới phải hoàn toàn vừa vặn với cơ thể, tư thế và tỷ lệ của người đó.
- Ánh sáng, bóng đổ và kết cấu trên quần áo mới phải được điều chỉnh để hoàn toàn khớp với ánh sáng trên khuôn mặt của người từ ảnh gốc.
`;
    } else if (settings.outfit.keepOriginal) {
        prompt += `
**2. Chỉnh sửa trang phục:**
- Giữ lại quần áo gốc. Không thay đổi nó. Bạn có thể tinh chỉnh nhẹ nhàng sự gọn gàng nếu cần (ví dụ: loại bỏ các nếp nhăn nhỏ) nhưng kiểu dáng, màu sắc và hình thức phải giữ nguyên.
`;
    } else {
        prompt += `
**2. Chỉnh sửa trang phục:**
- Thay đổi quần áo của người đó thành: "${settings.outfit.mode === 'preset' ? settings.outfit.preset : settings.outfit.customPrompt}".
- **LOGIC THÔNG MINH:** Nếu trang phục được yêu cầu là một phụ kiện (như cà vạt, nơ, áo khoác ngoài) và người đó đã mặc một trang phục nền phù hợp (như áo sơ mi), hãy **THÊM** phụ kiện đó **LÊN TRÊN** trang phục hiện có. **ĐỪNG VẼ LẠI** toàn bộ áo.
- Trang phục mới phải trông hoàn toàn thực tế và hòa quyện liền mạch với cổ và vai của người, giữ nguyên tư thế.
- Ánh sáng, bóng đổ và kết cấu trên quần áo mới phải được điều chỉnh để hoàn toàn khớp với ánh sáng trên khuôn mặt của người từ ảnh gốc.
`;
    }

    prompt += `
**3. Điều chỉnh mặt & tóc:**
- Kiểu tóc: ${(() => {
    switch (settings.face.hairStyle) {
        case 'auto': return 'Làm cho tóc trông gọn gàng, phù hợp với ảnh chuyên nghiệp.';
        case 'down': return 'Tạo kiểu tóc thả xuống phía trước.';
        case 'slicked_back': return 'Tạo kiểu tóc vuốt ngược ra sau.';
        case 'keep_original': return 'QUAN TRỌNG: Giữ lại kiểu tóc gốc. Không thực hiện bất kỳ thay đổi nào về kiểu dáng, độ dài hoặc hình thức tóc của người đó.';
        default: return 'Làm cho tóc trông gọn gàng, phù hợp với ảnh chuyên nghiệp.';
    }
})()}
- Yêu cầu khác: ${settings.face.otherCustom ? `Kết hợp yêu cầu này: "${settings.face.otherCustom}"` : 'Không có yêu cầu tùy chỉnh nào khác.'}
`;

    if (!settings.face.keepOriginalFeatures) {
         prompt += `- Đặc điểm khuôn mặt: Các đặc điểm khuôn mặt gốc phải dễ nhận biết, nhưng bạn có thể tinh chỉnh nhẹ để có vẻ ngoài chuyên nghiệp.
- Biểu cảm: ${settings.face.slightSmile ? 'Điều chỉnh biểu cảm khuôn mặt thành một nụ cười mỉm nhẹ, khép miệng phù hợp với môi trường chuyên nghiệp.' : 'Giữ lại biểu cảm khuôn mặt gốc.'}
`;
    }
    
    if (settings.face.smoothSkin) {
        prompt += `- Chỉnh sửa da: Áp dụng hiệu ứng làm mịn da chuyên nghiệp. Loại bỏ các khuyết điểm nhỏ và độ bóng dầu, nhưng vẫn duy trì kết cấu da tự nhiên. Kết quả phải trông sạch sẽ và tự nhiên, không nhân tạo.
`;
    }

    prompt += `
**4. Bố cục đầu ra cuối cùng (CỰC KỲ QUAN TRỌNG):**
- Sau khi hoàn tất tất cả các chỉnh sửa, KHÔNG cắt ảnh.
- Thay vào đó, đặt người đã chỉnh sửa lên một canvas mới, lớn hơn.
- **Canvas mới này PHẢI có tỷ lệ khung hình chân dung tiêu chuẩn (ví dụ: khoảng 3:4 hoặc 2:3).**
- Lấp đầy hoàn toàn canvas này bằng màu nền đã chỉ định ở bước 1.
- Đảm bảo có không gian trống đáng kể (padding) xung quanh người ở tất cả các phía. Điều này rất quan trọng cho quá trình xử lý sau này.
- **CHỈ tạo ra hình ảnh cuối cùng có phần đệm.**
`;
    return prompt;
}
const BASE_PROMPT_INSTRUCTION = `You are a world-class expert in reverse-engineering images into prompts for generative AI. Your sole task is to analyze the provided image with microscopic detail and generate a prompt that can be used by an advanced AI image generator to reconstruct the original image with near-perfect, 1:1 fidelity. Your output MUST be a single, long, cohesive paragraph of descriptive phrases separated by commas. Do not use any other formatting. Your entire response must be ONLY the prompt.`;
const FACE_LOCK_INSTRUCTION = `**SPECIAL INSTRUCTION: FACE LOCK ACTIVE** For the **Facial Description** step, your task changes. Instead of creating a similar face, you must describe the provided face with 100% accuracy to ensure the AI reconstructs the *exact same person*. Detail the unique shape of their eyes, nose, lips, jawline, and chin with extreme precision. The goal is to retain the person's identity perfectly.`;
const buildImageVariationPrompt = (
  options: { aspectRatio: string; identityLock: number; variationStrength: number; themeAnchor: string; style: string; },
  variationIndex: number
): string => {
  const { aspectRatio, style, identityLock, variationStrength, themeAnchor } = options;
  const themeDescription = themeAnchor === 'Character-appropriate' ? "a context-appropriate background, AI-selected based on their appearance" : `a basic ${themeAnchor} style`;
  const themeAnchorInstruction = themeAnchor === 'Character-appropriate' ? `Main Theme: Intelligently select a theme that fits the character.` : `Main Theme: ${themeAnchor}. Use as a general direction.`;
  const variationDetails = [
    `[Image 1] Camera: medium portrait; Lighting: soft frontal; Background: ${themeDescription} with shallow DOF.`,
    `[Image 2] Camera: 3/4 body, high angle; Lighting: side key; Background: same theme, different area; Pose: head turned.`,
    `[Image 3] Camera: tight head-and-shoulders; Lighting: backlight/rim; Background: different texture (bokeh, foliage); Pose: gentle laugh.`,
    `[Image 4] Camera: medium-wide; Lighting: dramatic contrast; Background: new sub-location; Pose: look-away candid.`
  ];
  return `Generate 1 image at ${aspectRatio} in ${style} style using the uploaded reference as the subject to preserve identity (strength = ${identityLock}/100). Variation policy: target ~${variationStrength}% visual change. ${themeAnchorInstruction} Produce ONE image with these micro-variations: ${variationDetails[variationIndex]}. General constraints: Keep hairstyle/clothing consistent. Avoid repetitive framing. Photorealistic detail. No logos/text. Return only the image.`;
};

const buildRestorationPrompt = (options: RestorationOptions): string => {
    const { restorationLevel, removeScratches, colorize, faceEnhance, gender, age, context } = options;
    
    let prompt = `Bạn là một chuyên gia AI phục chế ảnh cũ. Hãy phục chế hình ảnh được cung cấp, tuân thủ nghiêm ngặt các yêu cầu sau. Ưu tiên tuyệt đối là BẢO TOÀN DANH TÍNH của người trong ảnh.
    
**YÊU CẦU PHỤC CHẾ:**
`;

    if (removeScratches) {
        prompt += `- **Loại bỏ Hư hỏng:** Sửa chữa tất cả các vết xước, vết rách, nếp gấp, và các hư hỏng vật lý khác trên ảnh. Sử dụng kỹ thuật inpainting nhận biết ngữ cảnh để lấp đầy các vùng bị mất một cách liền mạch. Khử nhiễu (noise) và các khối nén (artifact) một cách cẩn thận.\n`;
    }

    if (faceEnhance) {
        prompt += `- **Cải thiện Gương mặt:** Làm rõ nét các chi tiết trên khuôn mặt (mắt, lông mi, tóc) mà không làm thay đổi cấu trúc hoặc nhận dạng của người đó. Giảm nhẹ các nếp nhăn nhưng vẫn giữ lại kết cấu da tự nhiên. Giới tính: ${gender}, Tuổi: ${age}.\n`;
    }
    
    prompt += `- **Mức độ Phục hồi Tổng thể:** Áp dụng mức độ phục hồi chi tiết và độ nét ở mức ${restorationLevel}/100. Cân bằng độ tương phản và dải tần nhạy sáng (dynamic range) để ảnh trông rõ ràng hơn.\n`;

    if (colorize) {
        prompt += `- **Tô màu:** Tô màu cho ảnh một cách chân thực, phù hợp với thời đại của bức ảnh. Chọn tông màu da, quần áo và bối cảnh một cách tự nhiên. Nếu ảnh đã có màu, hãy khôi phục lại màu sắc gốc rực rỡ và chính xác hơn.\n`;
    } else {
        prompt += `- **Giữ ảnh Đen trắng:** KHÔNG tô màu. Giữ nguyên ảnh ở định dạng đen trắng hoặc thang độ xám gốc của nó, chỉ cải thiện độ tương phản và chi tiết.\n`;
    }

    if (context) {
        prompt += `- **Bối cảnh Bổ sung:** Dựa vào thông tin sau để phục chế chính xác hơn: "${context}".\n`;
    }

    prompt += `**QUAN TRỌNG NHẤT:** Khuôn mặt sau khi phục chế PHẢI là của cùng một người. Không thay đổi cấu trúc khuôn mặt. Chỉ làm cho nó rõ nét và chất lượng hơn.`

    return prompt;
};

// New prompt builder for Beauty Studio
const buildBeautyPrompt = (tool: BeautyFeature, subFeature: BeautySubFeature | null, style: BeautyStyle | null): string => {
    const mainInstruction = "You are an expert AI photo retouching artist. Your task is to perform a highly specific, localized modification on the provided image.";
    const preservationRule = "CRITICAL RULE: You MUST preserve all aspects of the original image—including the person's identity, facial expression, pose, background, and lighting—unless explicitly instructed to change them. Apply the change seamlessly and realistically. Only modify the target area. Do not regenerate the entire image.";
    const outputRule = "Return only the modified image, with no text or other artifacts.";

    let specificModification = "";
    const customPrompt = style?.promptInstruction || subFeature?.promptInstruction || tool?.promptInstruction;

    if (customPrompt) {
        let finalCustomPrompt = customPrompt;
        if (style) {
            finalCustomPrompt = finalCustomPrompt.replace('{{style}}', style.englishLabel);
        }
        if (subFeature) {
            finalCustomPrompt = finalCustomPrompt.replace('{{sub_feature}}', subFeature.englishLabel);
        }
        if(tool) {
            finalCustomPrompt = finalCustomPrompt.replace('{{tool}}', tool.englishLabel);
        }
        specificModification = `The specific modification is: ${finalCustomPrompt}`;
    } else {
        // Fallback for tools without specific instructions (though most should have them)
        let effectDescription = `Apply a '${tool.englishLabel}' effect.`;
        if (subFeature && style && style.id !== 'none') {
            effectDescription += ` Specifically for the '${subFeature.englishLabel}' with the style '${style.englishLabel}'.`;
        }
        specificModification = `The specific modification is: ${effectDescription}`;
    }

    return `${mainInstruction} ${preservationRule} ${specificModification} ${outputRule}`;
};


// --- END OF MERGED CODE ---

// --- Firebase Admin Initialization ---
try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
            throw new Error("Biến môi trường FIREBASE_SERVICE_ACCOUNT_JSON không được thiết lập.");
        }
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized successfully.");
    }
} catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
}

// --- Authentication and VIP Status Check ---
async function verifyToken(token: string) {
    if (!admin.apps.length) throw new Error("Firebase Admin SDK chưa được khởi tạo.");
    return admin.auth().verifyIdToken(token);
}

async function checkVipStatus(uid: string): Promise<boolean> {
    if (!admin.apps.length) throw new Error("Firebase Admin SDK chưa được khởi tạo.");
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
        return false;
    }
    const userData = userDoc.data();
    if (userData?.isAdmin) {
        return true;
    }
    if (userData?.subscriptionEndDate) {
        return new Date(userData.subscriptionEndDate) > new Date();
    }
    return false;
}

// --- Server-side Image Utilities ---

/**
 * Programmatically crops an image using Sharp to a specified aspect ratio.
 * This is the server-side equivalent of the client's `smartCrop`.
 */
const smartCropServer = async (imageBase64: string, aspectRatio: AspectRatio): Promise<string> => {
    const targetRatio = ASPECT_RATIO_MAP[aspectRatio];
    if (!targetRatio) throw new Error(`Tỉ lệ khung hình không hợp lệ: ${aspectRatio}`);

    const buffer = Buffer.from(imageBase64, 'base64');
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) throw new Error('Không thể đọc kích thước ảnh để cắt.');

    const sourceRatio = width / height;
    let cropWidth: number, cropHeight: number, cropX: number, cropY: number;

    if (sourceRatio > targetRatio) {
        cropHeight = height;
        cropWidth = Math.round(cropHeight * targetRatio);
        cropX = Math.round((width - cropWidth) / 2);
        cropY = 0;
    } else {
        cropWidth = width;
        cropHeight = Math.round(cropWidth / targetRatio);
        cropX = 0;
        cropY = Math.round((height - cropHeight) / 2);
    }
    
    const croppedBuffer = await image.extract({ left: cropX, top: cropY, width: cropWidth, height: cropHeight }).png().toBuffer();
    return croppedBuffer.toString('base64');
};

// Helper to convert base64 from client to a format the SDK understands
const base64ToPart = (fileData: { base64: string, mimeType: string }): Part => ({
    inlineData: {
        data: fileData.base64,
        mimeType: fileData.mimeType,
    },
});

const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key của máy chủ chưa được cấu hình. Vui lòng kiểm tra biến môi trường GEMINI_API_KEY hoặc API_KEY và liên hệ quản trị viên.");
    }
    return new GoogleGenAI({ apiKey });
};

const normalizeAndClampRois = (roisPct: ROIPercentage[], baseW: number, baseH: number): ROIAbsolute[] => {
  return roisPct.map(r => {
    let x = Math.round(r.xPct * baseW);
    let y = Math.round(r.yPct * baseH);
    let w = Math.round(r.wPct * baseW);
    let h = Math.round(r.hPct * baseH);
    // clamp biên
    x = Math.max(0, Math.min(x, baseW - 1));
    y = Math.max(0, Math.min(y, baseH - 1));
    w = Math.max(1, Math.min(w, baseW - x));
    h = Math.max(1, Math.min(h, baseH - y));
    return { memberId: r.memberId, x, y, w, h };
  });
};

const makeFeatherMaskBuffer = async (
  baseW: number,
  baseH: number,
  roi: ROIAbsolute,
  feather: number
) => {
  const rectSvg = Buffer.from(
    `<svg width="${roi.w}" height="${roi.h}"><rect x="0" y="0" width="${roi.w}" height="${roi.h}" fill="white"/></svg>`
  );

  const patch = await sharp(rectSvg).png().toBuffer();
  const patchFeather = await sharp(patch).blur(feather / 2).png().toBuffer();

  return await sharp({ create: { width: baseW, height: baseH, channels: 4, background: { r:0,g:0,b:0,alpha:0 } } })
    .composite([{ input: patchFeather as any, left: roi.x, top: roi.y }])
    .png()
    .toBuffer();
};


async function callGeminiWithRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 1200
): Promise<T> {
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      // The error object structure from the Gemini SDK might vary.
      // We need to robustly check for the status code and message.
      const status = err?.status || err?.response?.status;
      const message = (err?.message || err?.toString() || '').toLowerCase();
      const isOverloaded = status === 503 || message.includes('model is overloaded') || message.includes('service unavailable');

      if (!isOverloaded || attempt === maxRetries) {
        // Not an overload error, or we've run out of retries, so re-throw.
        throw err;
      }

      console.warn(
        `[Gemini][${label}] 503 overloaded, retry attempt ${attempt}/${maxRetries} after ${delay}ms`
      );
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2; // Exponential backoff
    }
  }

  // This line should theoretically not be reached.
  throw new Error(`[Gemini][${label}] Unexpected retry loop exit`);
}


const geminiReplaceFacePatch = async (
    ai: GoogleGenAI,
    refFacePart: Part,
    baseImagePart: Part,
    maskPart: Part,
    memberDescription: string
): Promise<string> => { // returns base64
    const inpaintPrompt = `[ROLE]
You are an expert facial inpainting and identity-preservation system.

[INPUTS]
(1) Reference Face – identity to preserve 100%.
(2) Base Image – scene to edit.
(3) White Mask – editable area; do not touch pixels outside.

[TARGET SUBJECT]
'${memberDescription}' (age/body notes if any).

[HARD CONSTRAINTS – IDENTITY MICRO-CONSTRAINTS]
- Eyes: iris hue/value, sclera exposure, eyelid crease, canthus angle.
- Nose: dorsum, alar base width, tip rotation/projection, nostril shape.
- Lips: vermilion thickness, Cupid’s bow, philtrum columns, commissure angle.
- Midface & Skin: nasolabial fold depth, malar prominence, preserve pores/micro-contrast.
- Hairline & Eyebrows: exact hairline contour, brow arch; do not redraw density.
- Pose tolerance ≤ 2° (yaw/pitch/roll) to fit ROI. Match white balance, key/fill ratio.
- ABSOLUTE: No change outside the white mask. Do NOT change jawline, chin length, or facial width. Preserve eye distance and nose–mouth vertical proportions exactly.

[OUTPUT]
Return image only (no text), seamlessly blended; lighting and WB match Base Image.`;
    
    const response: GenerateContentResponse = await callGeminiWithRetry<GenerateContentResponse>('family_pass2_inpaint', () => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [refFacePart, baseImagePart, maskPart, { text: inpaintPrompt }] },
            config: { responseModalities: [Modality.IMAGE] }
        })
    );

    const resultPart = response.candidates?.[0]?.content?.parts?.[0];
    if (!resultPart?.inlineData?.data) {
        throw new Error("Face inpainting failed to return an image.");
    }
    return resultPart.inlineData.data;
};

const geminiIdentityScore = async (
    ai: GoogleGenAI,
    refFacePart: Part,
    generatedFacePart: Part
): Promise<number> => {
    const prompt = `Critically compare Image#1 (reference face) vs Image#2 (generated face). 
Return ONLY valid JSON: {"similarity_score": float 0..1}. Strong match >= 0.85.`;

    const response: GenerateContentResponse = await callGeminiWithRetry<GenerateContentResponse>('family_pass3_identity_score', () =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [refFacePart, generatedFacePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarity_score: { type: Type.NUMBER }
                    }
                }
            }
        })
    );

    try {
        const jsonStr = (response.text ?? '{}').trim();
        const result = JSON.parse(jsonStr);
        return result.similarity_score || 0;
    } catch (e) {
        console.error("Failed to parse similarity score JSON:", response.text, e);
        return 0; // Return a low score on parse failure
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        if (!req.body) {
            return res.status(400).json({ error: 'Yêu cầu không có nội dung (body).'});
        }
        
        const { action, payload, idToken } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Thiếu tham số "action" trong yêu cầu.' });
        }
        
        const ai = getAi();
        const models = ai.models;

        // --- Real VIP Status Check ---
        let isVip = false;
        if (idToken) {
            try {
                const decodedToken = await verifyToken(idToken as string);
                isVip = await checkVipStatus(decodedToken.uid);
            } catch (authError: any) {
                console.warn('Authentication check failed:', authError.message);
                // Default to non-VIP if token is invalid, expired, etc.
                isVip = false;
            }
        }
        // --- End of VIP Status Check ---

        switch (action) {
            case 'generateFamilyPhoto_3_Pass': {
                const FAMILY_SIM_THRESHOLD = Number(process.env.FAMILY_SIM_THRESHOLD ?? 0.85);
                const FAMILY_MAX_REFINES = Number(process.env.FAMILY_MAX_REFINES ?? 3);

                if (!payload || !payload.settings) {
                    return res.status(400).json({ error: 'Missing settings for 3-pass family photo generation.' });
                }
                const settings: SerializedFamilyStudioSettings = payload.settings;
            
                // --- Pass 1: Generate Base Scene ---
                const memberPlaceholders = settings.members.map(m => `'${m.age}'`).join(', ');
                const baseScenePrompt = `Create a realistic, high-quality photograph with an aspect ratio of ${settings.aspectRatio}.
- **Scene:** ${settings.scene}.
- **Content:** The scene should contain ${settings.members.length} people: ${memberPlaceholders}.
- **Arrangement:** They are posed together in a style described as "${settings.pose}".
- **Outfits:** They are all wearing outfits matching the style "${settings.outfit}".
- **CRITICAL:** Do NOT generate detailed faces. Instead, render blurred, generic, or featureless placeholders for the faces. The focus is on the composition, lighting, and scene, not the identities.
- **Additional details:** ${settings.customPrompt || 'Create a warm and happy atmosphere.'}`;
                
                const baseSceneResponse: GenerateContentResponse = await callGeminiWithRetry<GenerateContentResponse>('family_pass1_base_scene', () =>
                    ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: baseScenePrompt }] },
                        config: { responseModalities: [Modality.IMAGE] }
                    })
                );
                
                const baseScenePart = baseSceneResponse.candidates?.[0]?.content?.parts?.[0];
                if (!baseScenePart?.inlineData?.data) {
                    throw new Error("Pass 1 Failed: Could not generate the base scene.");
                }
            
                let currentImageBuffer = Buffer.from(baseScenePart.inlineData.data, 'base64');
                const { width: baseW, height: baseH } = await sharp(currentImageBuffer).metadata();
                if (!baseW || !baseH) {
                    throw new Error("Pass 1 Failed: Could not read dimensions of the base scene.");
                }

                // --- Pass 1.5: Detect ROIs from the generated scene ---
                const roiDetectionPrompt = `Analyze the provided image. It contains ${settings.members.length} people with blurred or placeholder faces. Your task is to identify the bounding box for each of these placeholder faces.
Return ONLY a valid JSON array where each object represents a face and has the following keys: "xPct", "yPct", "wPct", "hPct". These values must be percentages (0.0 to 1.0) of the total image width and height.
The array should be sorted by the x-coordinate of the faces, from left to right.
Example for 2 faces: [{"xPct": 0.25, "yPct": 0.2, "wPct": 0.15, "hPct": 0.2}, {"xPct": 0.6, "yPct": 0.2, "wPct": 0.15, "hPct": 0.2}]`;

                const roiDetectionSchema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            xPct: { type: Type.NUMBER },
                            yPct: { type: Type.NUMBER },
                            wPct: { type: Type.NUMBER },
                            hPct: { type: Type.NUMBER },
                        },
                        required: ["xPct", "yPct", "wPct", "hPct"],
                    }
                };

                const detectedRoisResponse: GenerateContentResponse = await callGeminiWithRetry<GenerateContentResponse>('family_pass1_5_detect_roi', () => 
                    ai.models.generateContent({
                        model: 'gemini-2.5-pro',
                        contents: { parts: [baseScenePart, { text: roiDetectionPrompt }] },
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: roiDetectionSchema
                        }
                    })
                );

                let detectedRoisPct: ROIPercentage[];
                try {
                    const jsonStr = (detectedRoisResponse.text ?? '[]').trim();
                    const parsedRois = JSON.parse(jsonStr);
                    if (Array.isArray(parsedRois) && parsedRois.length === settings.members.length) {
                        detectedRoisPct = parsedRois.map((roi, index) => ({
                            ...roi,
                            memberId: settings.members[index].id
                        }));
                        console.log("Successfully detected ROIs from base scene.");
                    } else {
                        throw new Error(`Expected ${settings.members.length} ROIs, but detected ${parsedRois.length}.`);
                    }
                } catch(e) {
                    console.warn("Failed to detect ROIs from base scene, falling back to frontend-provided ROIs.", e);
                    detectedRoisPct = settings.rois; // Fallback to frontend calculation
                }
                
                const absRois: ROIAbsolute[] = normalizeAndClampRois(detectedRoisPct ?? settings.rois, baseW, baseH);
                
                const similarityScores: { memberId: string, score: number }[] = [];
                
                // --- Pass 2 & 3: Inpaint & Refine Loop ---
                for (const member of settings.members) {
                    const roi = absRois.find(r => r.memberId === member.id);
                    if (!roi) {
                        console.warn(`No ROI found for member ${member.id}, skipping.`);
                        similarityScores.push({ memberId: member.id, score: 0.0 });
                        continue;
                    }
            
                    const refFacePart = base64ToPart(member.photo);
                    const memberDescription = `${member.age}${member.bodyDescription ? ', ' + member.bodyDescription : ''}`;
            
                    let bestPatchFullImageBuffer: any | null = null;
                    let bestScore = -1.0;
                    
                    for (let i = 0; i < FAMILY_MAX_REFINES; i++) {
                        const feather = Math.round(Math.min(roi.w, roi.h) * 0.18);
                        const maskBuffer = await makeFeatherMaskBuffer(baseW, baseH, roi, feather);
                        const maskPart: Part = { inlineData: { data: maskBuffer.toString('base64'), mimeType: 'image/png' } };
                        const baseImagePart: Part = { inlineData: { data: currentImageBuffer.toString('base64'), mimeType: 'image/png' } };
            
                        // Pass 2: Inpaint
                        const inpaintedImageBase64 = await geminiReplaceFacePatch(ai, refFacePart, baseImagePart, maskPart, memberDescription);
                        const inpaintedImageBuffer = Buffer.from(inpaintedImageBase64, 'base64');
            
                        // Create a smaller, centered ROI for scoring to focus only on the face
                        const scoringRoi: ROIAbsolute = {
                            memberId: roi.memberId,
                            w: Math.round(roi.w * 0.7),
                            h: Math.round(roi.h * 0.7),
                            x: roi.x + Math.round((roi.w - roi.w * 0.7) / 2),
                            y: roi.y + Math.round((roi.h - roi.h * 0.7) / 2),
                        };

                        const generatedPatchBuffer = await sharp(inpaintedImageBuffer).extract({ left: scoringRoi.x, top: scoringRoi.y, width: scoringRoi.w, height: scoringRoi.h }).toBuffer();
                        const generatedPatchPart: Part = { inlineData: { data: generatedPatchBuffer.toString('base64'), mimeType: 'image/png' } };
            
                        // Pass 3: Score
                        const currentScore = await geminiIdentityScore(ai, refFacePart, generatedPatchPart);
            
                        if (currentScore > bestScore) {
                            bestScore = currentScore;
                            bestPatchFullImageBuffer = inpaintedImageBuffer;
                        }
            
                        if (bestScore >= FAMILY_SIM_THRESHOLD) {
                            break; // Early exit if we have a great match
                        }
                    }
            
                    if (bestScore >= FAMILY_SIM_THRESHOLD && bestPatchFullImageBuffer) {
                        // High score: use the well-blended inpaint result
                        currentImageBuffer = bestPatchFullImageBuffer;
                    } else {
                        // Low score: fallback to hard-swap for guaranteed identity
                        console.warn(`Low similarity score (${bestScore}) for member ${member.id}. Falling back to hard-swap.`);
                        const refFaceCropped = await sharp(Buffer.from(member.photo.base64, 'base64'))
                            .resize(roi.w, roi.h)
                            .toBuffer();
                        
                        const feather = Math.round(Math.min(roi.w, roi.h) * 0.12);
                        const hardSwapMask = await sharp({
                            create: { width: roi.w, height: roi.h, channels: 1, background: 255 }
                        }).blur(feather / 2).png().toBuffer();
            
                        const faceWithAlpha = await sharp(refFaceCropped)
                            .composite([{ input: hardSwapMask, blend: 'dest-in' }])
                            .png().toBuffer();
                        
                        currentImageBuffer = await sharp(currentImageBuffer)
                            .composite([{ input: faceWithAlpha, left: roi.x, top: roi.y }])
                            .toBuffer();
                    }
                    
                    similarityScores.push({ memberId: member.id, score: Math.max(0, bestScore) });
                }
            
                // --- Finalize ---
                const finalPngBuffer = await sharp(currentImageBuffer).png().toBuffer();
                const finalImageData = finalPngBuffer.toString('base64');
                const finalMimeType = 'image/png';
                
                return res.status(200).json({
                    imageData: `data:${finalMimeType};base64,${finalImageData}`,
                    similarityScores
                });
            }
            // LEGACY 1-PASS METHOD: Kept for A/B testing or fallback.
            case 'generateFamilyPhoto': {
                if (!payload || !payload.settings) {
                    return res.status(400).json({ error: 'Thiếu cài đặt cho ảnh gia đình.' });
                }
                const settings: SerializedFamilyStudioSettings = payload.settings;
                const model = 'gemini-2.5-flash-image';

                const parts: Part[] = [];
                settings.members.forEach(member => {
                    parts.push(base64ToPart(member.photo));
                });

                let identityInstructions = '';
                const memberDescriptions: string[] = [];
                settings.members.forEach((member, index) => {
                    const imageNumber = index + 1;
                    let description = member.age;
                    if (member.bodyDescription) {
                        description += `, vóc dáng ${member.bodyDescription}`;
                    }
                    identityInstructions += `\n- **Ảnh ${imageNumber}:** Dùng làm tham chiếu nhận dạng TUYỆT ĐỐI cho "${description}".`;
                    memberDescriptions.push(description);
                });

                const individualOutfitInstructions = settings.members
                    .map((member, index) => member.outfit ? `- "${memberDescriptions[index]}" mặc "${member.outfit}".` : '')
                    .filter(Boolean)
                    .join('\n');

                const individualPoseInstructions = settings.members
                    .map((member, index) => member.pose ? `- "${memberDescriptions[index]}" tạo dáng "${member.pose}".` : '')
                    .filter(Boolean)
                    .join('\n');

                const requestPrompt = `**BỐI CẢNH & BỐ CỤC:**
- **Địa điểm:** ${settings.scene}.
- **Trang phục chung:** ${settings.outfit}.
${individualOutfitInstructions ? `- **Ghi đè trang phục riêng:**\n${individualOutfitInstructions}` : ''}
- **Tạo dáng chung:** ${settings.pose}.
${individualPoseInstructions ? `- **Ghi đè tạo dáng riêng:**\n${individualPoseInstructions}` : ''}
- **Yêu cầu thêm:** ${settings.customPrompt || 'Tất cả mọi người đều trông tự nhiên và hạnh phúc.'}

**CHỈ THỊ HÒA HỢP (QUAN TRỌNG NHẤT):**
Tạo ra một bức ảnh DUY NHẤT, THỐNG NHẤT. Ánh sáng và bóng đổ phải nhất quán trên toàn bộ cảnh và trên tất cả mọi người. Phối cảnh, tỷ lệ và tông màu của mọi người phải hoàn toàn hòa hợp với hậu cảnh. Bức ảnh cuối cùng phải trông giống như được chụp trong một lần bấm máy duy nhất, không phải ảnh ghép.

**Tỷ lệ khung hình cuối cùng BẮT BUỘC là ${settings.aspectRatio}.**`;

                const faceConsistencyPrompt = `**CHỈ THỊ TỐI THƯỢỢNG: BẢO TOÀN NHẬN DẠNG & BỐ CỤC TOÀN CẢNH**
**MỤC TIÊU KÉP:**
1.  **BẢO TOÀN NHẬN DẠNG:** Tạo ra một hình ảnh trong đó khuôn mặt của MỌI người là BẢN SAO HOÀN HẢO, GIỐNG HỆT với các ảnh tham chiếu nhận dạng tương ứng.
2.  **BỐ CỤC TOÀN CẢNH:** Sáng tác toàn bộ bức ảnh trong MỘT lần duy nhất để đảm bảo tính chân thực và nhất quán.

**QUY TẮC BẤT DI BẤT DỊCH:**
1.  **NGUỒN NHẬN DẠNG (THEO THỨ TỰ):** ${identityInstructions}
2.  **SAO CHÉP KHUÔN MẶT:** Khuôn mặt của mỗi người trong ảnh cuối cùng PHẢI LÀ BẢN SAO CHÍNH XÁC 1:1. KHÔNG thay đổi cấu trúc, đường nét, hoặc biểu cảm.
3.  **THỰC HIỆN YÊU CẦU:** Thực hiện các yêu cầu bối cảnh và bố cục dưới đây, nhưng CHỈ SAU KHI đã thỏa mãn tất cả các quy tắc bảo toàn nhận dạng.
---
**YÊU CẦU CẢNH & BỐ CỤC:**
${requestPrompt}
---
**CHỈ THỊ CHẤT LƯỢNG:** Ảnh cuối cùng phải là một tuyệt tác siêu thực (photorealistic masterpiece), chất lượng 8K, với các chi tiết siêu nét (hyper-detailed), kết cấu da tự nhiên.
**KIỂM TRA CUỐI CÙNG:** Trước khi tạo, hãy xác nhận bạn sẽ sao chép hoàn hảo TẤT CẢ các khuôn mặt và sáng tác một cảnh thống nhất duy nhất.`;
                
                parts.push({ text: settings.faceConsistency ? faceConsistencyPrompt : requestPrompt });

                const response: GenerateContentResponse = await models.generateContent({
                    model,
                    contents: { parts },
                    config: { responseModalities: [Modality.IMAGE] }
                });

                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart.inlineData.mimeType) {
                    throw new Error("AI đã thất bại trong việc tạo ảnh gia đình thống nhất.");
                }

                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }
            case 'generateBeautyPhoto': {
                if (!payload || !payload.baseImage || !payload.tool) {
                    return res.status(400).json({ error: 'Thiếu ảnh gốc hoặc thông tin công cụ.' });
                }
                const { baseImage, tool, subFeature, style } = payload;

                const prompt = buildBeautyPrompt(tool, subFeature, style);
                const imagePart: Part = { inlineData: { data: baseImage.split(',')[1], mimeType: baseImage.split(';')[0].split(':')[1] } };

                const response: GenerateContentResponse = await models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
                });

                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart.inlineData.mimeType) {
                    throw new Error("API không trả về hình ảnh cho Beauty Studio.");
                }
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateVideoPrompt': {
                if (!payload || !payload.userIdea || !payload.base64Image) {
                    return res.status(400).json({ error: 'Thiếu ý tưởng người dùng hoặc ảnh.' });
                }
                const { userIdea, base64Image } = payload;

                const imagePart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: 'image/png' // Assuming PNG from client, could be improved
                    }
                };
                
                const prompt = `Act as a professional video prompt creator. Analyze the user's idea and the provided image.
User Idea: "${userIdea}"
Based on this, create a detailed, cinematic, and highly descriptive video generation prompt in English.
Then, provide a professional translation of that English prompt into Vietnamese.
Your final output must be ONLY a valid JSON object with two keys: "englishPrompt" and "vietnamesePrompt". Do not include any other text, explanations, or markdown backticks.
Example response format:
{
  "englishPrompt": "An ultra-realistic 4K video of a person standing on a windy cliff, their hair flowing, cinematic lighting during golden hour, epic ocean waves crashing below.",
  "vietnamesePrompt": "Một video 4K siêu thực về một người đứng trên vách đá lộng gió, mái tóc bay trong gió, ánh sáng điện ảnh vào giờ vàng, những con sóng đại dương hùng vĩ vỗ vào bên dưới."
}`;

                const response: GenerateContentResponse = await models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: { parts: [imagePart, { text: prompt }] },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                englishPrompt: { type: Type.STRING },
                                vietnamesePrompt: { type: Type.STRING }
                            }
                        }
                    }
                });
                
                const jsonStr = (response.text ?? '{}').trim();
                const prompts = JSON.parse(jsonStr);
                
                if (!prompts.englishPrompt || !prompts.vietnamesePrompt) {
                    throw new Error("AI đã không tạo ra được prompt hợp lệ.");
                }

                return res.status(200).json({ prompts });
            }
            case 'generateIdPhoto': {
                if (!payload || !payload.originalImage || !payload.settings) return res.status(400).json({ error: 'Thiếu ảnh gốc hoặc cài đặt.' });
                const { originalImage, settings, outfitImagePart } = payload;
                
                // 1. Generate prompt
                const requestPrompt = buildIdPhotoPrompt(settings);
                const fullPrompt = createFinalPromptVn(requestPrompt, true);

                // 2. Prepare parts for Gemini
                const imagePart: Part = { inlineData: { data: originalImage.split(',')[1], mimeType: originalImage.split(';')[0].split(':')[1] } };
                const parts: Part[] = [];
                if (outfitImagePart) parts.push(outfitImagePart);
                parts.push(imagePart);
                parts.push({ text: fullPrompt });

                // 3. Call Gemini to get padded image
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const paddedImageB64 = resultPart.inlineData.data;

                // 4. Server-side smart crop
                const croppedImageB64 = await smartCropServer(paddedImageB64, settings.aspectRatio);

                // 5. Send final image to client (Watermarking is now done on client-side)
                const finalMimeType = 'image/png'; // smartCropServer always returns png
                return res.status(200).json({ imageData: `data:${finalMimeType};base64,${croppedImageB64}` });
            }

            case 'generateHeadshot': {
                if (!payload || !payload.imagePart || !payload.prompt) return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt.' });
                const { imagePart, prompt } = payload;

                const fullPrompt = createFinalPromptEn(prompt, true);
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart.inlineData.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }
            
            case 'performRestoration': {
                if (!payload || !payload.imagePart || !payload.options) return res.status(400).json({ error: 'Thiếu ảnh hoặc tùy chọn phục hồi.' });
                const { imagePart, options } = payload;

                const requestPrompt = buildRestorationPrompt(options);
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                
                const response: GenerateContentResponse = await models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [imagePart, { text: fullPrompt }] },
                    config: { responseModalities: [Modality.IMAGE] }
                });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) {
                    throw new Error("API không trả về hình ảnh.");
                }
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateFashionPhoto': {
                if (!payload || !payload.imagePart || !payload.settings) return res.status(400).json({ error: 'Thiếu ảnh hoặc cài đặt.' });
                const { imagePart, settings } = payload as { imagePart: Part, settings: FashionStudioSettings };
                
                const { category, style, description, highQuality, aspectRatio } = settings;
                const userDescription = description ? `${description}. ` : '';
                const highQualityPrompt = highQuality ? 'Chất lượng 4K, độ phân giải siêu cao, chi tiết cực cao. ' : '';
                
                let requestPrompt = '';
                switch (category) {
                    case 'female': requestPrompt = `Ảnh nữ doanh nhân cao cấp, phong cách ${style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh. ${userDescription}`; break;
                    case 'male': requestPrompt = `Ảnh nam doanh nhân cao cấp, phong cách ${style}, bối cảnh studio sang trọng tông màu hài hoà, ánh sáng điện ảnh. ${userDescription}`; break;
                    case 'girl': requestPrompt = `Ảnh lookbook thời trang bé gái chuyên nghiệp, mặc trang phục ${style}, bối cảnh studio hoặc ngoài trời phù hợp, ánh sáng tự nhiên. ${userDescription}`; break;
                    case 'boy': requestPrompt = `Ảnh lookbook thời trang bé trai chuyên nghiệp, mặc trang phục ${style}, bối cảnh studio hoặc ngoài trời phù hợp, năng động. ${userDescription}`; break;
                }
                requestPrompt += `${highQualityPrompt}Tỉ lệ khung: ${aspectRatio}. Không chữ, không logo, không viền, không watermark.`
                
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart.inlineData.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

             case 'generateFourSeasonsPhoto': {
                if (!payload || !payload.imagePart || !payload.scene) return res.status(400).json({ error: 'Thiếu ảnh hoặc bối cảnh.' });
                const { imagePart, scene, aspectRatio, customDescription } = payload;

                const requestPrompt = `Bối cảnh: "${scene.title} - ${scene.desc}". Người trong ảnh phải mặc trang phục phù hợp với bối cảnh. Chi tiết tùy chỉnh: ${customDescription.trim() !== '' ? `Thêm các chi tiết sau: "${customDescription}".` : 'Không có chi tiết tùy chỉnh.'} Máy ảnh & Ống kính: Mô phỏng ảnh chụp bằng Canon EOS R5, ống kính 85mm f/1.8. Ánh sáng: Ánh sáng điện ảnh, hậu cảnh xóa phông (bokeh). Lấy nét: Lấy nét cực sắc vào mắt. Tỷ lệ khung hình: BẮT BUỘC là ${aspectRatio}.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }
            
            case 'generatePromptFromImage': {
                if (!payload || !payload.base64Image || !payload.mimeType) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { base64Image, mimeType, isFaceLockEnabled, language } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const languageInstruction = `\n**LANGUAGE:** The final output prompt must be written entirely in ${language === 'vi' ? 'Vietnamese' : 'English'}.`;
                const systemInstruction = isFaceLockEnabled 
                    ? `${BASE_PROMPT_INSTRUCTION}\n\n${FACE_LOCK_INSTRUCTION}${languageInstruction}` 
                    : `${BASE_PROMPT_INSTRUCTION}${languageInstruction}`;

                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart] }, config: { systemInstruction } });
                return res.status(200).json({ prompt: (response.text ?? '').trim() });
            }

            case 'detectOutfit': {
                if (!payload || !payload.base64Image || !payload.mimeType) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { base64Image, mimeType } = payload;
                
                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const prompt = "Analyze the image and identify the main, most prominent piece of clothing the person is wearing. Respond with ONLY the name of the clothing in lowercase Vietnamese. For example: 'áo dài', 'vest', 'áo sơ mi'. Do not add any other words, punctuation, or explanations.";
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] } });
                return res.status(200).json({ outfit: (response.text ?? '').trim() });
            }

            case 'editOutfitOnImage': {
                if (!payload || !payload.base64Image || !payload.mimeType || !payload.newOutfitPrompt) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh hoặc mô tả trang phục.' });
                const { base64Image, mimeType: inputMimeType, newOutfitPrompt } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType: inputMimeType } };
                const requestPrompt = `Nhiệm vụ DUY NHẤT của bạn là thay đổi trang phục. Trang phục mới: "${newOutfitPrompt}". Trang phục mới phải trông hoàn toàn thực tế và hòa quyện liền mạch với cổ và vai của người. Ánh sáng trên quần áo mới phải hoàn toàn khớp với ánh sáng hiện có trong ảnh. KHÔNG thay đổi tỉ lệ hay cắt ảnh.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateFootballPhoto': {
                if (!payload || !payload.settings) return res.status(400).json({ error: 'Thiếu cài đặt.' });
                const { settings } = payload as { settings: FootballStudioSettings };
                if (!settings.sourceImage) {
                    throw new Error("Thiếu ảnh nguồn cho tính năng Studio Bóng Đá.");
                }

                const { mode, team, player, scene, style, customPrompt } = settings;
                
                let requestPrompt = '';
                if(mode === 'idol') {
                    requestPrompt = `Ghép ảnh người dùng với cầu thủ bóng đá ${player} (${team}) trong bối cảnh "${scene}". Phong cách: ${style}. ${customPrompt || ''}`;
                } else {
                    requestPrompt = `Cho cầu thủ ${player} (${team}) mặc trang phục từ ảnh được cung cấp, trong bối cảnh "${scene}". Phong cách: ${style}. ${customPrompt || ''}`;
                }

                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const imagePart = base64ToPart(settings.sourceImage);
                const response: GenerateContentResponse = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart.inlineData.mimeType) throw new Error("API không trả về hình ảnh.");

                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateImagesFromFeature': {
                const { featureAction, formData, numImages } = payload;
                if (!featureAction || !formData) return res.status(400).json({ error: 'Thiếu action hoặc dữ liệu form.' });

                let promptsToRun: { prompt: string, parts: Part[], isCouple?: boolean, gender1?: string, gender2?: string, faceConsistency?: boolean }[] = [];

                switch(featureAction) {
                    case FeatureAction.YOGA_STUDIO: {
                        const { subject_image, yoga_pose, location, lighting, outfit, face_consistency } = formData;
                        if (!subject_image || !yoga_pose) {
                            throw new Error('Thiếu ảnh hoặc tư thế yoga.');
                        }
                        const prompt = `**Photorealistic Masterpiece:** A person is performing the yoga pose "${yoga_pose}".
- **Location:** ${location}.
- **Lighting:** ${lighting}.
- **Outfit:** ${outfit}.
- **Realism Details:** Shot on a Canon EOS R5 with an 85mm f/1.2 lens, cinematic lighting, hyper-detailed, extremely sharp focus on the subject, natural skin texture with pores visible, realistic fabric texture on clothes, background has a beautiful cinematic bokeh.`;
                        const parts = [base64ToPart(subject_image)];
                        promptsToRun.push({ prompt, parts, faceConsistency: face_consistency });
                        break;
                    }
                    case FeatureAction.IMAGE_VARIATION_GENERATOR: {
                        const { reference_image, aspectRatio, identityLock, variationStrength, themeAnchor, style } = formData;
                        if (!reference_image) throw new Error('Thiếu ảnh tham chiếu.');
                        
                        const imagePart = base64ToPart(reference_image);
                        
                        for (let i = 0; i < 4; i++) {
                            const prompt = buildImageVariationPrompt({ aspectRatio, identityLock, variationStrength, themeAnchor, style }, i);
                            promptsToRun.push({ prompt, parts: [imagePart] });
                        }
                        break;
                    }
                     case FeatureAction.PRODUCT_PHOTO: {
                        const { subject_image, product_image, prompt_detail, frame_style, aspect_ratio } = formData;
                        if (!subject_image) throw new Error('Thiếu ảnh người mẫu.');
                        
                        const parts = [base64ToPart(subject_image)];
                        let prompt = `Người mẫu (từ ảnh 1) đang quảng cáo một sản phẩm. ${prompt_detail || ''}. Khung hình: ${frame_style}. Tỷ lệ ảnh: ${aspect_ratio}.`;
                        
                        if (product_image) {
                            parts.push(base64ToPart(product_image));
                            prompt = `Người mẫu (từ ảnh 1) đang quảng cáo sản phẩm (từ ảnh 2). ${prompt_detail || ''}. Khung hình: ${frame_style}. Tỷ lệ ảnh: ${aspect_ratio}.`;
                        }
                        
                        promptsToRun.push({ prompt, parts });
                        break;
                    }
                    case FeatureAction.FASHION_STUDIO: {
                        const { subject_image, style_level, wardrobe, pose_style, sexy_background, lighting, frame_style, aspect_ratio } = formData;
                        if (!subject_image) throw new Error('Thiếu ảnh người mẫu.');
                        
                        const parts = [base64ToPart(subject_image)];
                        let prompt = `Chụp ảnh thời trang chuyên nghiệp. Phong cách: ${style_level}. Trang phục/phụ kiện: ${wardrobe.join(', ')}. Tư thế: ${pose_style}. Bối cảnh: ${sexy_background}. Ánh sáng: ${lighting}. Khung hình: ${frame_style}. Tỷ lệ ảnh: ${aspect_ratio}.`;
                        
                        promptsToRun.push({ prompt, parts });
                        break;
                    }
                    case FeatureAction.KOREAN_STYLE_STUDIO: {
                        const { subject_image, k_concept, aspect_ratio, quality, face_consistency } = formData;
                        if (!subject_image || !k_concept) {
                            throw new Error('Thiếu ảnh chủ thể hoặc concept cho tính năng Studio Phong Cách Hàn.');
                        }
                        
                        let qualityPrompt = '';
                        if (quality === 'high') qualityPrompt = 'high resolution, 4K,';
                        if (quality === 'ultra') qualityPrompt = 'hyper-detailed, 8K, photorealistic, cinematic lighting,';

                        const prompt = `${qualityPrompt} ${k_concept}. ${HIDDEN_ADDONS}. Final aspect ratio must be ${aspect_ratio}.`;
                        const parts = [base64ToPart(subject_image)];
                        promptsToRun.push({ prompt, parts, faceConsistency: face_consistency });
                        break;
                    }
                    case FeatureAction.TRY_ON_OUTFIT: {
                        const { subject_image, outfit_image, prompt_detail, frame_style } = formData;
                        if (!subject_image || !outfit_image) throw new Error('Thiếu ảnh người mẫu hoặc ảnh trang phục.');
                        const prompt = `Người mẫu (từ ảnh 1) mặc trang phục (từ ảnh 2). ${prompt_detail || ''}. Khung hình: ${frame_style}.`;
                        const parts = [base64ToPart(subject_image), base64ToPart(outfit_image)];
                        promptsToRun.push({ prompt, parts });
                        break;
                    }
                    case FeatureAction.PLACE_IN_SCENE:
                    case FeatureAction.BIRTHDAY_PHOTO:
                    case FeatureAction.HOT_TREND_PHOTO:
                    case FeatureAction.CREATE_ALBUM: {
                        const { subject_image } = formData;
                        if (!subject_image) throw new Error('Thiếu ảnh chủ thể.');
                        const baseParts = [base64ToPart(subject_image)];
                        let combinations: { pose?: string, background?: string }[] = [];

                        if (featureAction === FeatureAction.CREATE_ALBUM) {
                            const poses = formData.poses || [];
                            const backgrounds = formData.backgrounds || [];
                            if (poses.length === 0 || backgrounds.length === 0) throw new Error('Vui lòng chọn ít nhất một tư thế và một bối cảnh.');
                            poses.forEach((pose: string) => backgrounds.forEach((bg: string) => combinations.push({ pose, background: bg })));
                        } else {
                            const backgrounds: string[] = formData.background_options || formData.birthday_scenes || formData.selected_trends || [];
                            backgrounds.forEach(bg => combinations.push({ background: bg }));
                            if (featureAction === FeatureAction.PLACE_IN_SCENE && formData.custom_background_prompt) {
                                combinations.push({ background: formData.custom_background_prompt });
                            }
                        }

                        combinations.forEach(combo => {
                            let prompt = `Bối cảnh: ${combo.background}.`;
                            if (combo.pose) prompt += ` Tư thế: ${combo.pose}.`;
                            if (formData.frame_style) prompt += ` Khung hình: ${formData.frame_style}.`;
                            promptsToRun.push({ prompt, parts: baseParts });
                        });

                        if (featureAction === FeatureAction.PLACE_IN_SCENE && formData.background_image) {
                            if (!subject_image) throw new Error('Thiếu ảnh chủ thể.');
                            promptsToRun.push({ prompt: 'Ghép người vào ảnh nền được cung cấp.', parts: [baseParts[0], base64ToPart(formData.background_image)] });
                        }
                        break;
                    }
                    case FeatureAction.COUPLE_COMPOSE: {
                        const { person_left_image, person_right_image, person_left_gender, person_right_gender, affection_action, aesthetic_style, couple_background, custom_background } = formData;
                        if (!person_left_image || !person_right_image) throw new Error('Thiếu ảnh của một hoặc cả hai người.');
                        
                        const gender1 = person_left_gender?.replace('aiStudio.inputs.couple_compose.genders.', '');
                        const gender2 = person_right_gender?.replace('aiStudio.inputs.couple_compose.genders.', '');

                        let prompt = `Ghép hai người lại với nhau. Hành động: ${affection_action}. Phong cách: ${aesthetic_style}.`;
                        const parts = [base64ToPart(person_left_image), base64ToPart(person_right_image)];

                        if (custom_background) {
                            parts.push(base64ToPart(custom_background));
                            prompt += ` Bối cảnh: Sử dụng bối cảnh từ ảnh cuối cùng.`;
                        } else if (couple_background) {
                            prompt += ` Bối cảnh: ${couple_background}.`;
                        }

                        promptsToRun.push({ prompt, parts, isCouple: true, gender1, gender2 });
                        break;
                    }
                    case FeatureAction.CHANGE_HAIRSTYLE: {
                        const { subject_image, hairstyle, hair_color, hair_length } = formData;
                        if (!subject_image || !hairstyle || !hair_color || !hair_length) throw new Error('Vui lòng điền đầy đủ thông tin kiểu tóc.');
                        const prompt = `Đổi kiểu tóc thành ${hairstyle}, màu ${hair_color}, độ dài ${hair_length}.`;
                        const parts = [base64ToPart(subject_image)];
                        promptsToRun.push({ prompt, parts });
                        break;
                    }
                    case FeatureAction.EXTRACT_OUTFIT: {
                        const { subject_image } = formData;
                        if (!subject_image) throw new Error('Thiếu ảnh chủ thể cho tính năng Tách Trang phục.');
                        const parts = [base64ToPart(subject_image)];
                        const prompt = `Phân tích người trong ảnh này. Nhiệm vụ của bạn là "cắt" kỹ thuật số CHỈ quần áo của họ. Tạo một hình ảnh mới chỉ chứa trang phục, với người và nền đã được loại bỏ hoàn toàn. Đầu ra phải là quần áo trên nền trong suốt hoặc nền trung tính.`;
                        promptsToRun.push({ prompt, parts });
                        break;
                    }
                    case FeatureAction.CREATIVE_COMPOSITE: {
                        const { main_subject, scene_description, additional_components, main_subject_description, aspect_ratio } = formData;
                        if (!main_subject?.file?.base64) {
                            throw new Error('Thiếu ảnh chủ thể chính.');
                        }
                        if (!scene_description) {
                            throw new Error('Thiếu mô tả bối cảnh.');
                        }

                        const parts: Part[] = [base64ToPart(main_subject.file)];
                        let prompt = `Bối cảnh và bố cục chính: ${scene_description}\n\n`;

                        prompt += `Chủ thể chính (ảnh đầu tiên): ${main_subject_description || 'Người/vật trong ảnh đầu tiên.'}\n\n`;

                        if (additional_components && Array.isArray(additional_components)) {
                            additional_components.forEach((comp: any, index: number) => {
                                // The description is stored separately in formData
                                const componentDescription = formData[`additional_components_${index}_description`];
                                if (comp.file?.base64) {
                                    parts.push(base64ToPart(comp.file));
                                    prompt += `Thành phần phụ ${index + 1} (ảnh thứ ${parts.length}): ${componentDescription || 'Người/vật trong ảnh này.'}\n`;
                                }
                            });
                        }

                        prompt += `\nTỉ lệ khung hình cuối cùng: ${aspect_ratio || '4:3'}.`;
                        
                        promptsToRun.push({ prompt, parts, isCouple: false });
                        break;
                    }
                    default:
                        throw new Error(`Tính năng '${featureAction}' chưa được triển khai trên backend.`);
                }

                if (promptsToRun.length === 0) {
                     return res.status(400).json({ error: `Không có tác vụ nào để thực hiện cho tính năng '${featureAction}'. Vui lòng kiểm tra lại đầu vào.` });
                }

                const promises = promptsToRun.flatMap(({ prompt, parts, isCouple, gender1, gender2, faceConsistency }) => {
                    const userRequest = createFinalPromptVn(prompt, faceConsistency ?? (parts.length > 0), isCouple, gender1, gender2);
                    const finalParts = [...parts, { text: userRequest }];
                    const loopCount = promptsToRun.length > 1 ? 1 : numImages;
                    
                    return Array(loopCount).fill(0).map(() => models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: finalParts },
                        config: { responseModalities: [Modality.IMAGE] }
                    }));
                });
                
                const results = await Promise.allSettled(promises);
                let successfulImages: string[] = [];
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        const part = (r.value as GenerateContentResponse).candidates?.[0]?.content?.parts?.[0];
                        if (part?.inlineData?.data) {
                            successfulImages.push(part.inlineData.data);
                        }
                    }
                });

                return res.status(200).json({ images: successfulImages, successCount: successfulImages.length });
            }

            case 'getHotTrends': {
                 const response: GenerateContentResponse = await models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Đóng vai một chuyên gia xu hướng mạng xã hội. Tìm kiếm trên web các xu hướng nhiếp ảnh và chỉnh sửa hình ảnh trực quan mới nhất và phổ biến nhất trên các nền tảng như TikTok, Instagram và Pinterest. Lập một danh sách gồm 25 xu hướng đa dạng và sáng tạo có thể áp dụng cho ảnh của một người. Đặt một cái tên ngắn gọn, hấp dẫn cho mỗi xu hướng bằng tiếng Việt. Chỉ trả về một mảng JSON hợp lệ chứa các chuỗi, trong đó mỗi chuỗi là một tên xu hướng. Không bao gồm các dấu ngoặc kép markdown (\`\`\`json), giải thích hoặc bất kỳ văn bản nào khác ngoài mảng JSON.`,
                    config: { tools: [{googleSearch: {}}] }
                });
                let jsonStr = (response.text ?? '').trim().match(/(\[[\s\S]*\])/)?.[0];
                if (!jsonStr) throw new Error("Không thể phân tích xu hướng từ phản hồi của AI.");
                return res.status(200).json({ trends: JSON.parse(jsonStr) });
            }
            
            case 'generateThumbnail': {
                if (!payload || !payload.modelImage) return res.status(400).json({ error: 'Thiếu ảnh người mẫu.' });
                
                const { modelImage, refImage, inputs, ratio } = payload;
                const { title, speaker, outfit, action, extra } = inputs;
                
                const prompt = `Phân tích ảnh người mẫu (ảnh 1) và ảnh tham khảo (ảnh 2, nếu có). Tạo một đối tượng JSON để thiết kế thumbnail YouTube ${ratio === '16:9' ? 'ngang' : 'dọc'} theo chủ đề "${title}". Yêu cầu:
1.  **background_prompt**: Tạo một prompt DALL-E 3, bằng tiếng Anh, để tạo một background tuyệt đẹp, tương phản cao, phù hợp chủ đề. Bao gồm phong cách (trừu tượng, gradient, cảnh thực), màu sắc, bố cục. Background phải tôn người mẫu, không gây xao lãng.
2.  **model_action**: Tạo một tư thế hoặc hành động mới cho người mẫu để trông năng động và thu hút hơn bản gốc. Mô tả tư thế, biểu cảm, hướng nhìn.
3.  **text_elements**: Tạo một mảng các phần tử văn bản, thường gồm tiêu đề chính và phụ đề/tên diễn giả. Mỗi phần tử là một đối tượng có 'text', 'type' ('title', 'speaker', 'detail'), và 'font_size' ('large', 'medium', 'small').
Nội dung tham khảo: Diễn giả: ${speaker}, Trang phục: ${outfit}, Hành động: ${action}, Ghi chú: ${extra}`;
                
                const parts: Part[] = [{ inlineData: { data: modelImage, mimeType: 'image/jpeg' } }];
                if (refImage) {
                    parts.push({ inlineData: { data: refImage, mimeType: 'image/jpeg' } });
                }
                parts.push({text: prompt});
                
                const schema = {
                    type: Type.OBJECT,
                    properties: {
                        background_prompt: {
                            type: Type.STRING,
                            description: 'A DALL-E 3 prompt, in English, to generate a visually stunning, high-contrast background that matches the theme. Include style (e.g., abstract, gradient, realistic scene), colors, and composition. The background should complement the model without being distracting.'
                        },
                        model_action: {
                            type: Type.STRING,
                            description: 'A new pose or action for the model to perform that is more dynamic and engaging than the original. Describe the pose, expression, and gaze direction.'
                        },
                        text_elements: {
                            type: Type.ARRAY,
                            description: "An array of text elements to be placed on the thumbnail. Typically includes a main title and a subtitle/speaker name.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    type: { type: Type.STRING, 'enum': ['title', 'speaker', 'detail'] },
                                    font_size: { type: Type.STRING, description: 'Relative size like "large", "medium", "small"' }
                                }
                            }
                        }
                    }
                };

                const response: GenerateContentResponse = await models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: { parts: parts },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                    }
                });

                const jsonResponse = JSON.parse((response.text ?? '').trim());
                
                const { background_prompt } = jsonResponse;
                
                const dallEModel = 'imagen-4.0-generate-001';
                const dallEResponse = await ai.models.generateImages({
                    model: dallEModel,
                    prompt: background_prompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: ratio
                    }
                });
                
                let data = dallEResponse?.generatedImages?.[0]?.image?.imageBytes;

                if (!data) {
                    throw new Error("Không thể tạo ảnh nền thumbnail từ AI. Phản hồi không hợp lệ.");
                }

                const finalMimeType = 'image/jpeg';
                return res.status(200).json({ image: `data:${finalMimeType};base64,${data}` });
            }
            
            case 'generateVideoFromImage': {
                if (!payload || !payload.base64Image || !payload.prompt) {
                    return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt để tạo video.' });
                }

                const { base64Image, prompt } = payload;
                const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
                if (!apiKey) {
                    throw new Error("API Key của máy chủ chưa được cấu hình.");
                }

                // Per Veo guidelines, create a new instance right before the call
                const aiForVideo = new GoogleGenAI({ apiKey });

                let operation = await aiForVideo.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt,
                    image: {
                        imageBytes: base64Image,
                        mimeType: 'image/png', // Assuming PNG as client doesn't send mimeType
                    },
                    config: {
                        numberOfVideos: 1,
                        resolution: '720p',
                        aspectRatio: '9:16' // Defaulting to portrait
                    }
                });

                // Poll for completion - this might time out on Vercel Hobby/Pro
                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
                    operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
                }
                
                if (operation.error) {
                    throw new Error(`Lỗi tạo video: ${operation.error.message || JSON.stringify(operation.error)}`);
                }

                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

                if (!downloadLink) {
                    throw new Error("Không tìm thấy link tải video trong phản hồi của API.");
                }
                
                // Fetch the video bytes from the generated URL
                const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
                if (!videoResponse.ok) {
                    const errorBody = await videoResponse.text();
                    console.error("Lỗi khi tải video từ link:", errorBody);
                    // This specific error is handled by the client to re-prompt for a key
                    if (errorBody.includes("Requested entity was not found")) {
                        throw new Error("Requested entity was not found.");
                    }
                    throw new Error(`Không thể tải video từ link được tạo. Status: ${videoResponse.status}`);
                }
                
                const videoArrayBuffer = await videoResponse.arrayBuffer();
                const videoBase64 = Buffer.from(videoArrayBuffer as ArrayBuffer).toString('base64');
                const videoUrl = `data:video/mp4;base64,${videoBase64}`;

                return res.status(200).json({ videoUrl });
            }

            default:
                return res.status(400).json({ error: `Tính năng '${action}' chưa được triển khai trên backend.` });
        }
    } catch (error: any) {
        console.error(`[Vercel Serverless] Lỗi khi thực thi action "${req.body?.action}":`, error);
        
        let errorMessage = 'Đã xảy ra lỗi không xác định ở máy chủ.';
        let statusCode = 500;

        if (error.message) {
            errorMessage = error.message;
        }
        
        // Use a more robust check for overload errors
        const errorString = (error.message || JSON.stringify(error) || '').toLowerCase();
        if (error?.status === 503 || errorString.includes('model is overloaded') || errorString.includes('service unavailable')) {
            statusCode = 503;
            errorMessage = "The model is overloaded. Please try again later.";
            // Return a structured error that the frontend can parse
            return res.status(statusCode).json({ error: { code: 503, message: errorMessage, status: 'UNAVAILABLE' } });
        }

        if (errorString.includes('429') || errorString.includes('resource_exhausted') || errorString.includes('rate limit')) {
            statusCode = 429;
            errorMessage = "Bạn đã vượt quá hạn ngạch sử dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
        } else if (errorString.includes('api_key_invalid') || errorString.includes('api key not valid') || error.message.includes('GEMINI_API_KEY')) {
            errorMessage = "API Key của máy chủ không hợp lệ hoặc bị thiếu. Vui lòng liên hệ quản trị viên.";
            statusCode = 500;
        } else if (error instanceof TypeError) {
             errorMessage = `Lỗi cú pháp hoặc dữ liệu không hợp lệ ở máy chủ: ${error.message}`;
             statusCode = 400;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
}