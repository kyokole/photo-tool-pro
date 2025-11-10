// /api/gemini.ts
// This is a Vercel Serverless Function that acts as a secure backend proxy.
// It has been made self-contained to prevent Vercel bundling issues.

import { GoogleGenAI, Modality, Part } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';


// --- MERGED TYPES from types.ts ---
// These types are included directly to make this file self-contained.
type AspectRatio = '2x3' | '3x4' | '4x6' | '5x5';
type FashionAspectRatio = '1:1' | '4:3' | '9:16' | '16:9';
type OutfitMode = 'preset' | 'custom' | 'upload';
type HairStyle = 'auto' | 'down' | 'slicked_back' | 'keep_original';
type BackgroundMode = 'white' | 'light_blue' | 'custom' | 'ai';
type PrintLayout = 'none' | '10x15' | '13x18' | '20x30';
type PaperBackground = 'white' | 'gray';
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
const INITIAL_CLEAN_PROMPT = `
Thực hiện một bước phục chế sơ bộ trên hình ảnh này. Mục tiêu chính là làm rõ các đường viền và chi tiết khuôn mặt, cân bằng lại các mảng tối và giảm độ nhòe của nền. 
QUAN TRỌNG: KHÔNG xóa hết các vết xước hoặc vết mốc. Chỉ thực hiện một lần làm sạch nhẹ nhàng để chuẩn bị cho các bước phục chế sâu hơn. Giữ lại phần lớn các khuyết điểm nhỏ để duy trì cảm giác chân thực.
`;
const ADVANCED_RESTORATION_PROMPT = `
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
const COLORIZATION_PROMPT = `
Bạn là một chuyên gia AI tô màu ảnh. Hãy tô màu cho bức ảnh đen trắng đã được phục chế mà tôi cung cấp. Mục tiêu là tạo ra một bức ảnh chân dung chất lượng cao, trông như mới được chụp trong thời đại xưa, giữ được nét cổ điển nhưng với độ trong và ấm áp. Hãy tuân thủ nghiêm ngặt các yêu cầu sau:

- **Chất lượng tổng thể:** Phục dựng ảnh gần như mới hoàn toàn, giống như một bức chân dung chụp mới từ thập niên xưa.
- **Gương mặt:** Làm cho gương mặt hai nhân vật rõ nét, tự nhiên, mắt sáng, và da mịn màng nhưng vẫn giữ được kết cấu da thật. Tuyệt đối BẢO TOÀN DANH TÍNH.
- **Màu sắc:** Áp dụng một tông màu ấm hơn (sepia tone) cho toàn bộ ảnh để tạo cảm giác cổ điển, hoài niệm.
- **Hậu cảnh và chi tiết:** Đảm bảo nền ảnh nhẵn mịn không còn vết xước. Áo, tóc, và các phụ kiện (ví dụ: khăn ren, quân phục) phải đều sắc nét, khôi phục chi tiết gần như nguyên bản.
- **Phong cách:** Kết hợp giữa nét cổ điển và sự rõ ràng, sắc nét của ảnh hiện đại.

Hãy tiến hành tô màu cho bức ảnh.
`;

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

    return `**CHỈ THỊ TỐI THƯỢNG: BẢO TOÀN NHẬN DẠNG**
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

// --- Watermark Logic ---
const WATERMARK_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAEGKSURBVHhe7b3/l1XVdQfw3+8+5/zPueeec++111prbW1ta2trbWttrbXW+uee+3/f53w/nMsc5y6XM+e+z/f9fr/fa6+11t57b73X3nvvtdZa6/1+vx+yIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAiCIAi-sprint-";
const WATERMARK_MIME_TYPE = "image/png";

async function applyWatermark(generatedImageBase64: string, originalMime: string, ai: GoogleGenAI): Promise<{ data: string, mime: string }> {
    const watermarkPart: Part = {
        inlineData: {
            data: WATERMARK_BASE64,
            mimeType: WATERMARK_MIME_TYPE,
        },
    };
    const imagePart: Part = {
        inlineData: {
            data: generatedImageBase64,
            mimeType: originalMime,
        },
    };
    const promptPart: Part = {
        text: "Overlay the second image (the logo) onto the bottom-right corner of the first image. The logo should have about 50% transparency and be scaled down to be noticeable but not obstructive. Do not alter the first image in any other way."
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, watermarkPart, promptPart] },
            config: { responseModalities: [Modality.IMAGE] }
        });
        
        const watermarkedPart = response.candidates?.[0]?.content?.parts?.[0];
        const watermarkedData = watermarkedPart?.inlineData?.data;
        const watermarkedMime = watermarkedPart?.inlineData?.mimeType;

        if (!watermarkedData || !watermarkedMime) {
            console.warn("Watermarking failed, returning original image.");
            return { data: generatedImageBase64, mime: originalMime };
        }
        return { data: watermarkedData, mime: watermarkedMime };

    } catch (error) {
        console.error("Error during watermarking API call, returning original image.", error);
        return { data: generatedImageBase64, mime: originalMime };
    }
}

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
                
                const requestPrompt = buildIdPhotoPrompt(settings);
                const fullPrompt = createFinalPromptVn(requestPrompt, true);

                const imagePart: Part = { inlineData: { data: originalImage.split(',')[1], mimeType: originalImage.split(';')[0].split(':')[1] } };
                const parts: Part[] = [];
                if (outfitImagePart) parts.push(outfitImagePart);
                parts.push(imagePart);
                parts.push({ text: fullPrompt });

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");
                
                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateHeadshot': {
                if (!payload || !payload.imagePart || !payload.prompt) return res.status(400).json({ error: 'Thiếu ảnh hoặc prompt.' });
                const { imagePart, prompt } = payload;

                const fullPrompt = createFinalPromptVn(prompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }
            
            case 'initialCleanImage':
            case 'advancedRestoreImage':
            case 'colorizeImage': {
                if (!payload || !payload.imagePart) return res.status(400).json({ error: 'Thiếu dữ liệu ảnh.' });
                const { imagePart } = payload;

                let prompt = '';
                if (action === 'initialCleanImage') prompt = INITIAL_CLEAN_PROMPT;
                else if (action === 'advancedRestoreImage') prompt = ADVANCED_RESTORATION_PROMPT;
                else if (action === 'colorizeImage') prompt = COLORIZATION_PROMPT;

                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");
                
                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                }
                // The restoration tool on the client side expects raw base64, so we only send the data part.
                return res.status(200).json({ imageData: data });
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
                
                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

             case 'generateFourSeasonsPhoto': {
                if (!payload || !payload.imagePart || !payload.scene) return res.status(400).json({ error: 'Thiếu ảnh hoặc bối cảnh.' });
                const { imagePart, scene, aspectRatio, customDescription } = payload;

                const requestPrompt = `Bối cảnh: "${scene.title} - ${scene.desc}". Người trong ảnh phải mặc trang phục phù hợp với bối cảnh. Chi tiết tùy chỉnh: ${customDescription.trim() !== '' ? `Thêm các chi tiết sau: "${customDescription}".` : 'Không có chi tiết tùy chỉnh.'} Máy ảnh & Ống kính: Mô phỏng ảnh chụp bằng Canon EOS R5, ống kính 85mm f/1.8. Ánh sáng: Ánh sáng điện ảnh, hậu cảnh xóa phông (bokeh). Lấy nét: Lấy nét cực sắc vào mắt. Tỷ lệ khung hình: BẮT BUỘC là ${aspectRatio}.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
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
                const { base64Image, mimeType, newOutfitPrompt } = payload;

                const imagePart = { inlineData: { data: base64Image, mimeType } };
                const requestPrompt = `Nhiệm vụ DUY NHẤT của bạn là thay đổi trang phục. Trang phục mới: "${newOutfitPrompt}". Trang phục mới phải trông hoàn toàn thực tế và hòa quyện liền mạch với cổ và vai của người. Ánh sáng trên quần áo mới phải hoàn toàn khớp với ánh sáng hiện có trong ảnh. KHÔNG thay đổi tỉ lệ hay cắt ảnh.`;
                const fullPrompt = createFinalPromptVn(requestPrompt, true);
                const response = await models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [imagePart, { text: fullPrompt }] }, config: { responseModalities: [Modality.IMAGE] } });
                const resultPart = response.candidates?.[0]?.content?.parts?.[0];
                if (!resultPart?.inlineData?.data || !resultPart?.inlineData?.mimeType) throw new Error("API không trả về hình ảnh.");

                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
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

                let { data, mime } = resultPart.inlineData;

                if (!isVip) {
                    const watermarked = await applyWatermark(data, mime, ai);
                    data = watermarked.data;
                    mime = watermarked.mime;
                }
                return res.status(200).json({ imageData: `data:${mime};base64,${data}` });
            }

            case 'generateImagesFromFeature': {
                const { featureAction, formData, numImages } = payload;
                if (!featureAction || !formData) return res.status(400).json({ error: 'Thiếu action hoặc dữ liệu form.' });

                let promptsToRun: { prompt: string, parts: Part[], isCouple?: boolean, gender1?: string, gender2?: string }[] = [];

                switch(featureAction) {
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
                        const { person_left_image, person_right_image, person_left_gender, person_right_gender } = formData;
                        if (!person_left_image || !person_right_image) throw new Error('Thiếu ảnh của một hoặc cả hai người.');
                        const gender1 = person_left_gender?.replace('aiStudio.inputs.couple_compose.genders.', '');
                        const gender2 = person_right_gender?.replace('aiStudio.inputs.couple_compose.genders.', '');
                        let prompt = `Hành động: ${formData.affection_action}. Phong cách: ${formData.aesthetic_style}.`;
                        const parts = [base64ToPart(person_left_image), base64ToPart(person_right_image)];
                        if (formData.custom_background) {
                            parts.push(base64ToPart(formData.custom_background));
                            prompt += ` Bối cảnh: Sử dụng bối cảnh từ ảnh cuối cùng.`;
                        } else if (formData.couple_background) {
                            prompt += ` Bối cảnh: ${formData.couple_background}.`;
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
                let successfulImages: { data: string, mime: string }[] = [];
                results.forEach(r => {
                    if (r.status === 'fulfilled') {
                        const part = r.value.candidates?.[0]?.content?.parts?.[0];
                        if (part?.inlineData?.data && part?.inlineData?.mimeType) {
                            successfulImages.push({ data: part.inlineData.data, mime: part.inlineData.mimeType });
                        }
                    }
                });

                let finalImageB64s: string[];
                if (!isVip) {
                    const watermarkedResults = await Promise.all(successfulImages.map(img => applyWatermark(img.data, img.mime, ai)));
                    finalImageB64s = watermarkedResults.map(res => res.data); // Only return base64 string
                } else {
                    finalImageB64s = successfulImages.map(img => img.data); // Only return base64 string
                }

                return res.status(200).json({ images: finalImageB64s, successCount: finalImageB64s.length });
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

            default:
                return res.status(400).json({ error: `Action không xác định: ${action}` });
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