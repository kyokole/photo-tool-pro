// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
// It has been made self-contained to prevent Vercel bundling issues.

// FIX: Import Buffer from the 'buffer' module to resolve 'Cannot find name' errors.
import { Buffer } from 'buffer';
// FIX: Import 'Type' from '@google/genai' to resolve 'Cannot find name 'TYPE'' error.
import { GoogleGenAI, Modality, Part, Type } from '@google/genai';
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
const createFinalPromptVn = (userRequest: string, hasIdentityImages: boolean, isCouple: boolean = false, gender1?: string, gender2?: string): string => {
    if (!hasIdentityImages) {
        return `**NHIỆM VỤ:** Tạo một bức ảnh nghệ thuật, chất lượng cao dựa trên yêu cầu của người dùng.\n\n**YÊU CẦU (Tiếng Việt):** ${userRequest}`;
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
**KIỂM TRA CUỐI CÙNG:** Trước khi tạo ảnh, hãy xác nhận kế hoạch của bạn bao gồm việc sao chép hoàn hảo (các) khuôn mặt nhận dạng.`;
};
const buildIdPhotoPrompt = (settings: Settings): string => {
    let prompt = `**Bước tiền xử lý quan trọng: Cắt ảnh chân dung trong đầu**
Trước mọi chỉnh sửa khác, bạn PHẢI phân tích ảnh gốc. Nếu đó là ảnh góc rộng, ảnh phong cảnh, hoặc chứa nhiều hậu cảnh, nhiệm vụ đầu tiên của bạn là cắt ảnh trong đầu thành một bức chân dung tiêu chuẩn từ đầu đến vai. Chỉ tập trung vào đầu và phần thân trên của chủ thể chính. Loại bỏ tất cả các yếu tố cảnh quan khác. Tất cả các chỉnh sửa tiếp theo (nền, quần áo, v.v.) sẽ CHỈ được thực hiện trên khu vực chân dung đã cắt trong đầu này. Điều này đảm bảo đầu ra cuối cùng là một bức chân dung đúng nghĩa, không phải là một hình người nhỏ trong một khung hình lớn.

Hãy đóng vai một biên tập viên ảnh chuyên nghiệp. Nhiệm vụ của bạn là thực hiện các chỉnh sửa chất lượng cao trên một bức chân dung do người dùng cung cấp.
Làm theo các hướng dẫn cụ thể về nền, quần áo và điều chỉnh khuôn mặt dưới đây.
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
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const paddedImageB64 = resultPart.inlineData.data;

                // 4. Server-side smart crop
                const croppedImageB64 = await smartCropServer(paddedImageB64, settings.aspectRatio);

                // 5. Send final image to client (Watermarking is now done on client-side)
                const finalMimeType = 'image/png'; // smartCropServer always returns png
                return res.status(200).json({ imageData: `data:${finalMimeType};base64,${croppedImageB64}` });
            }

            case 'applyBeautyEffect': {
                if (!payload || !payload.base64Image || !payload.prompt) {
                    return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt.' });
                }
                const { base64Image, prompt } = payload;
                
                const imagePart: Part = { inlineData: { data: base64Image.split(',')[1], mimeType: base64Image.split(';')[0].split(':')[1] } };
                const fullPrompt = createFinalPromptVn(prompt, true);
            
                const response = await models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [imagePart, { text: fullPrompt }] },
                    config: { responseModalities: [Modality.IMAGE] }
                });
            
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData.mimeType) {
                    throw new Error("API không trả về hình ảnh.");
                }
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateHeadshot': {
                if (!payload || !payload.imagePart || !payload.prompt) return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt.' });
                const { imagePart, prompt } = payload;

                const fullPrompt = createFinalPromptVn(prompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }
            
            case 'performRestoration': {
                if (!payload || !payload.imagePart || !payload.options) return res.status(400).json({ error: 'Thiếu ảnh hoặc tùy chọn phục hồi.' });
                const { imagePart, options } = payload;

                const requestPrompt = buildRestorationPrompt(options);
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                
                const response = await models.generateContent({
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
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");
                
                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

             case 'generateFourSeasonsPhoto': {
                if (!payload || !payload.imagePart || !payload.scene) return res.status(400).json({ error: 'Thiếu ảnh hoặc bối cảnh.' });
                const { imagePart, scene, aspectRatio, customDescription } = payload;

                const requestPrompt = `Bối cảnh: "${scene.title} - ${scene.desc}". Người trong ảnh phải mặc trang phục phù hợp với bối cảnh. Chi tiết tùy chỉnh: ${customDescription.trim() !== '' ? `Thêm các chi tiết sau: "${customDescription}".` : 'Không có chi tiết tùy chỉnh.'} Máy ảnh & Ống kính: Mô phỏng ảnh chụp bằng Canon EOS R5, ống kính 85mm f/1.8. Ánh sáng: Ánh sáng điện ảnh, hậu cảnh xóa phông (bokeh). Lấy nét: Lấy nét cực sắc vào mắt. Tỷ lệ khung hình: BẮT BUỘC là ${aspectRatio}.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
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

                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart] }, config: { systemInstruction } });
                return res.status(200).json({ prompt: (response.text ?? '').trim() });
            }

            case 'detectOutfit': {
                if (!payload || !payload.base64Image || !payload.mimeType) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { base64Image, mimeType } = payload;
                
                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const prompt = "Analyze the image and identify the main, most prominent piece of clothing the person is wearing. Respond with ONLY the name of the clothing in lowercase Vietnamese. For example: 'áo dài', 'vest', 'áo sơ mi'. Do not add any other words, punctuation, or explanations.";
                const response = await models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, { text: prompt }] } });
                return res.status(200).json({ outfit: (response.text ?? '').trim() });
            }

            case 'editOutfitOnImage': {
                if (!payload || !payload.base64Image || !payload.mimeType || !payload.newOutfitPrompt) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh hoặc mô tả trang phục.' });
                const { base64Image, mimeType: inputMimeType, newOutfitPrompt } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType: inputMimeType } };
                const requestPrompt = `Nhiệm vụ DUY NHẤT của bạn là thay đổi trang phục. Trang phục mới: "${newOutfitPrompt}". Trang phục mới phải trông hoàn toàn thực tế và hòa quyện liền mạch với cổ và vai của người. Ánh sáng trên quần áo mới phải hoàn toàn khớp với ánh sáng hiện có trong ảnh. KHÔNG thay đổi tỉ lệ hay cắt ảnh.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
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
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                const { data, mimeType } = resultPart.inlineData;
                return res.status(200).json({ imageData: `data:${mimeType};base64,${data}` });
            }

            case 'generateImagesFromFeature': {
                const { featureAction, formData, numImages } = payload;
                if (!featureAction || !formData) return res.status(400).json({ error: 'Thiếu action hoặc dữ liệu form.' });

                let promptsToRun: { prompt: string, parts: Part[], isCouple?: boolean, gender1?: string, gender2?: string }[] = [];

                switch(featureAction) {
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

                        const finalUserRequest = `${qualityPrompt} ${k_concept}. ${HIDDEN_ADDONS}. Final aspect ratio must be ${aspect_ratio}.`;
                        const fullPrompt = createFinalPromptVn(finalUserRequest, face_consistency);
                        const parts = [base64ToPart(subject_image), { text: fullPrompt }];
                        promptsToRun.push({ prompt: finalUserRequest, parts });
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

                const promises = promptsToRun.flatMap(({ prompt, parts, isCouple, gender1, gender2 }) => {
                    const userRequest = createFinalPromptVn(prompt, parts.length > 0, isCouple, gender1, gender2);
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
                        const part = r.value.candidates?.[0]?.content?.parts?.[0];
                        if (part?.inlineData?.data) {
                            successfulImages.push(part.inlineData.data);
                        }
                    }
                });

                return res.status(200).json({ images: successfulImages, successCount: successfulImages.length });
            }

            case 'getHotTrends': {
                 const response = await models.generateContent({
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
                    // FIX: Changed uppercase TYPE to lowercase Type to match the import.
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

                const response = await models.generateContent({
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
        
        let errorStringForSearch = '';
        try {
            errorStringForSearch = JSON.stringify(error);
        } catch {
            errorStringForSearch = String(error);
        }

        if (errorStringForSearch.includes('429') || errorStringForSearch.includes('RESOURCE_EXHAUSTED') || errorStringForSearch.includes('rate limit')) {
            statusCode = 429;
            errorMessage = "Bạn đã vượt quá hạn ngạch sử dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
        } else if (errorStringForSearch.includes('API_KEY_INVALID') || errorStringForSearch.includes('API key not valid') || error.message.includes('GEMINI_API_KEY')) {
            errorMessage = "API Key của máy chủ không hợp lệ hoặc bị thiếu. Vui lòng liên hệ quản trị viên.";
            statusCode = 500;
        } else if (error instanceof TypeError) {
             errorMessage = `Lỗi cú pháp hoặc dữ liệu không hợp lệ ở máy chủ: ${error.message}`;
             statusCode = 400;
        }

        return res.status(statusCode).json({ error: errorMessage });
    }
}