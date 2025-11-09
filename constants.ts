import type { Settings, HeadshotStyle, AspectRatio, FashionAspectRatio, FashionStyle } from './types';

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
};

// OUTFIT_PRESETS now uses keys for names, which will be translated by the UI, and includes a previewUrl
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

// HEADSHOT_STYLES now uses nameKey for i18n
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

// --- Constants for the new Restoration Tool ---

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

// --- Constants for the new Fashion Studio ---

export const FASHION_FEMALE_STYLES: FashionStyle[] = [
    { key: "fashionStyles.female.luxury_vest", promptValue: "Vest nữ tỷ đô sang trọng" },
    { key: "fashionStyles.female.evening_gown", promptValue: "Váy dạ hội tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.black_vest", promptValue: "Vest nữ đen tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.white_vest", promptValue: "Vest nữ trắng tỷ đô siêu đẳng cấp" },
    { key: "fashionStyles.female.red_vest", promptValue: "Vest nữ đỏ tỷ đô siêu đẹp" },
    { key: "fashionStyles.female.cobalt_vest", promptValue: "Vest nữ xanh coban tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.moss_green_vest", promptValue: "Vest nữ xanh rêu tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.pink_vest", promptValue: "Vest nữ hồng phấn tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.beige_vest", promptValue: "Vest nữ be kem tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.gray_vest", promptValue: "Vest nữ xám khói tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.chocolate_vest", promptValue: "Vest nữ nâu socola tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.purple_vest", promptValue: "Vest nữ tím than tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.navy_vest", promptValue: "Vest nữ xanh navy tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.gold_vest", promptValue: "Vest nữ vàng đồng tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.emerald_vest", promptValue: "Vest nữ xanh ngọc tỷ đô đẳng cấp" },
    { key: "fashionStyles.female.pastel_vest", promptValue: "Vest nữ pastel sang trọng tỷ đô" },
    { key: "fashionStyles.female.business_dress", promptValue: "Váy doanh nhân sang trọng tỷ đô" },
    { key: "fashionStyles.female.sheath_dress", promptValue: "Đầm sheath tối giản doanh nhân" },
    { key: "fashionStyles.female.peplum_dress", promptValue: "Đầm peplum tôn dáng cao cấp" },
    { key: "fashionStyles.female.blazer_dress", promptValue: "Blazer dress quyền lực tỷ đô" },
    { key: "fashionStyles.female.tweed_vest", promptValue: "Vest tweed cao cấp quý phái" },
    { key: "fashionStyles.female.pinstripe_vest", promptValue: "Vest kẻ sọc mảnh hiện đại" },
    { key: "fashionStyles.female.collarless_vest", promptValue: "Vest không cổ tối giản" },
    { key: "fashionStyles.female.double_breasted_vest", promptValue: "Vest double-breasted couture" },
    { key: "fashionStyles.female.belted_vest", promptValue: "Vest thắt lưng bản lớn tôn eo" },
    { key: "fashionStyles.female.trench_suit", promptValue: "Vest dáng dài trench-suit" },
    { key: "fashionStyles.female.satin_vest", promptValue: "Vest satin bóng nhẹ sang trọng" },
    { key: "fashionStyles.female.velvet_vest", promptValue: "Vest nhung đen hoàng gia" },
    { key: "fashionStyles.female.satin_dress", promptValue: "Váy satin bóng cao cấp" },
    { key: "fashionStyles.female.jumpsuit", promptValue: "Jumpsuit suit nữ doanh nhân" },
    { key: "fashionStyles.female.traditional_ao_dai", promptValue: "Áo dài truyền thống" },
    { key: "fashionStyles.female.modern_ao_dai", promptValue: "Áo dài cách tân" },
    { key: "fashionStyles.female.red_wedding_ao_dai", promptValue: "Áo dài cưới đỏ" },
    { key: "fashionStyles.female.white_wedding_ao_dai", promptValue: "Áo dài cưới trắng" },
    { key: "fashionStyles.female.velvet_ao_dai", promptValue: "Áo dài nhung" },
    { key: "fashionStyles.female.lace_ao_dai", promptValue: "Áo dài ren" },
    { key: "fashionStyles.female.brocade_ao_dai", promptValue: "Áo dài gấm" },
    { key: "fashionStyles.female.embroidered_ao_dai", promptValue: "Áo dài thêu tay" },
    { key: "fashionStyles.female.silk_ao_dai", promptValue: "Áo dài lụa trơn tối giản" },
    { key: "fashionStyles.female.printed_ao_dai", promptValue: "Áo dài họa tiết in hiện đại" },
    { key: "fashionStyles.female.short_sleeve_ao_dai_1", promptValue: "Áo dài tay lửng" },
    { key: "fashionStyles.female.short_sleeve_ao_dai_2", promptValue: "Áo dài tay ngắn" },
    { key: "fashionStyles.female.boat_neck_ao_dai", promptValue: "Áo dài cổ thuyền" },
    { key: "fashionStyles.female.round_neck_ao_dai", promptValue: "Áo dài cổ tròn" },
    { key: "fashionStyles.female.square_neck_ao_dai", promptValue: "Áo dài cổ vuông" },
    { key: "fashionStyles.female.low_neck_ao_dai", promptValue: "Áo dài cổ thấp" },
    { key: "fashionStyles.female.bell_sleeve_ao_dai", promptValue: "Áo dài tay loe" },
    { key: "fashionStyles.female.straight_fit_ao_dai", promptValue: "Áo dài dáng suông" },
    { key: "fashionStyles.female.ao_dai_with_vest", promptValue: "Áo dài phối vest" },
    { key: "fashionStyles.female.retro_ao_dai", promptValue: "Áo dài phong cách retro" },
    { key: "fashionStyles.female.classic_white_shirt", promptValue: "Áo sơ mi trắng cổ điển" },
    { key: "fashionStyles.female.striped_shirt", promptValue: "Áo sơ mi kẻ sọc" },
    { key: "fashionStyles.female.puffy_sleeve_shirt", promptValue: "Áo sơ mi tay phồng" },
    { key: "fashionStyles.female.bow_neck_shirt", promptValue: "Áo sơ mi cổ nơ" },
    { key: "fashionStyles.female.chiffon_shirt", promptValue: "Áo sơ mi chiffon" },
    { key: "fashionStyles.female.silk_shirt", promptValue: "Áo sơ mi lụa sang trọng" },
    { key: "fashionStyles.female.oversized_shirt", promptValue: "Áo sơ mi dáng rộng" },
    { key: "fashionStyles.female.denim_shirt", promptValue: "Áo sơ mi denim công sở" },
    { key: "fashionStyles.female.classic_vest", promptValue: "Áo vest cổ điển" },
    { key: "fashionStyles.female.oversized_vest_top", promptValue: "Áo vest oversize" },
    { key: "fashionStyles.female.sleeveless_vest", promptValue: "Áo vest không tay" },
    { key: "fashionStyles.female.long_vest", promptValue: "Áo vest dáng dài" },
    { key: "fashionStyles.female.gilet_with_shirt", promptValue: "Áo gile phối sơ mi" },
    { key: "fashionStyles.female.modern_blazer", promptValue: "Áo blazer hiện đại" },
    { key: "fashionStyles.female.straight_trousers", promptValue: "Quần tây ống đứng" },
    { key: "fashionStyles.female.wide_leg_trousers", promptValue: "Quần tây ống rộng" },
    { key: "fashionStyles.female.cropped_trousers", promptValue: "Quần tây lửng" },
    { key: "fashionStyles.female.pencil_skirt", promptValue: "Chân váy bút chì" },
    { key: "fashionStyles.female.a_line_skirt", promptValue: "Chân váy chữ A" }
];
export const FASHION_MALE_STYLES: FashionStyle[] = [
    { key: "fashionStyles.male.classic_white_shirt", promptValue: "Áo sơ mi trắng cổ điển" },
    { key: "fashionStyles.male.plaid_shirt", promptValue: "Áo sơ mi caro" },
    { key: "fashionStyles.male.striped_shirt", promptValue: "Áo sơ mi kẻ sọc" },
    { key: "fashionStyles.male.denim_shirt", promptValue: "Áo sơ mi denim" },
    { key: "fashionStyles.male.silk_shirt", promptValue: "Áo sơ mi lụa sang trọng" },
    { key: "fashionStyles.male.short_sleeve_shirt", promptValue: "Áo sơ mi tay ngắn" },
    { key: "fashionStyles.male.long_sleeve_shirt", promptValue: "Áo sơ mi tay dài" },
    { key: "fashionStyles.male.patterned_shirt", promptValue: "Áo sơ mi họa tiết" },
    { key: "fashionStyles.male.oversized_shirt", promptValue: "Áo sơ mi oversize" },
    { key: "fashionStyles.male.mandarin_collar_shirt", promptValue: "Áo sơ mi cổ trụ" },
    { key: "fashionStyles.male.plain_tshirt", promptValue: "Áo thun trơn" },
    { key: "fashionStyles.male.crew_neck_tshirt", promptValue: "Áo thun cổ tròn" },
    { key: "fashionStyles.male.v_neck_tshirt", promptValue: "Áo thun cổ tim" },
    { key: "fashionStyles.male.polo_shirt", promptValue: "Áo thun polo" },
    { key: "fashionStyles.male.logo_tshirt", promptValue: "Áo thun in logo" },
    { key: "fashionStyles.male.oversized_tshirt", promptValue: "Áo thun oversize" },
    { key: "fashionStyles.male.bodyfit_tshirt", promptValue: "Áo thun bodyfit" },
    { key: "fashionStyles.male.raglan_sleeve_tshirt", promptValue: "Áo thun tay raglan" },
    { key: "fashionStyles.male.long_sleeve_tshirt", promptValue: "Áo thun dài tay" },
    { key: "fashionStyles.male.tanktop", promptValue: "Áo tanktop" },
    { key: "fashionStyles.male.classic_vest", promptValue: "Áo vest cổ điển" },
    { key: "fashionStyles.male.slimfit_vest", promptValue: "Áo vest slimfit" },
    { key: "fashionStyles.male.oversized_vest", promptValue: "Áo vest oversize" },
    { key: "fashionStyles.male.modern_blazer", promptValue: "Áo blazer hiện đại" },
    { key: "fashionStyles.male.plaid_blazer", promptValue: "Áo blazer kẻ caro" },
    { key: "fashionStyles.male.sleeveless_blazer", promptValue: "Áo blazer không tay" },
    { key: "fashionStyles.male.long_blazer", promptValue: "Áo blazer dáng dài" },
    { key: "fashionStyles.male.tuxedo", promptValue: "Áo tuxedo sang trọng" },
    { key: "fashionStyles.male.gilet", promptValue: "Áo gile nam" },
    { key: "fashionStyles.male.wool_gilet", promptValue: "Áo ghi lê len" },
    { key: "fashionStyles.male.bomber_jacket", promptValue: "Áo khoác bomber" },
    { key: "fashionStyles.male.leather_jacket", promptValue: "Áo khoác da" },
    { key: "fashionStyles.male.jean_jacket", promptValue: "Áo khoác jean" },
    { key: "fashionStyles.male.hoodie", promptValue: "Áo khoác hoodie" },
    { key: "fashionStyles.male.cardigan", promptValue: "Áo khoác cardigan" },
    { key: "fashionStyles.male.parka", promptValue: "Áo khoác parka" },
    { key: "fashionStyles.male.long_coat", promptValue: "Áo khoác măng tô" },
    { key: "fashionStyles.male.puffer_jacket", promptValue: "Áo khoác puffer" },
    { key: "fashionStyles.male.varsity_jacket", promptValue: "Áo khoác varsity" },
    { key: "fashionStyles.male.trench_coat", promptValue: "Áo khoác trench coat" },
    { key: "fashionStyles.male.straight_trousers", promptValue: "Quần tây ống đứng" },
    { key: "fashionStyles.male.slimfit_trousers", promptValue: "Quần tây slimfit" },
    { key: "fashionStyles.male.straight_jeans", promptValue: "Quần jeans ống đứng" },
    { key: "fashionStyles.male.ripped_jeans", promptValue: "Quần jeans rách" },
    { key: "fashionStyles.male.skinny_jeans", promptValue: "Quần jeans skinny" },
    { key: "fashionStyles.male.baggy_jeans", promptValue: "Quần jeans baggy" },
    { key: "fashionStyles.male.chinos", promptValue: "Quần chinos" },
    { key: "fashionStyles.male.khaki_shorts", promptValue: "Quần short kaki" },
    { key: "fashionStyles.male.jean_shorts", promptValue: "Quần short jean" },
    { key: "fashionStyles.male.jogger_pants", promptValue: "Quần jogger" },
    { key: "fashionStyles.male.fleece_tracksuit", promptValue: "Bộ đồ thể thao nỉ" },
    { key: "fashionStyles.male.gym_tshirt", promptValue: "Áo thun tập gym" },
    { key: "fashionStyles.male.gym_tanktop", promptValue: "Áo tanktop gym" },
    { key: "fashionStyles.male.gym_joggers", promptValue: "Quần jogger gym" },
    { key: "fashionStyles.male.sport_shorts", promptValue: "Quần short thể thao" },
    { key: "fashionStyles.male.sport_jacket", promptValue: "Áo khoác thể thao" },
    { key: "fashionStyles.male.sport_hoodie", promptValue: "Áo hoodie thể thao" },
    { key: "fashionStyles.male.sport_polo", promptValue: "Áo polo thể thao" },
    { key: "fashionStyles.male.football_jersey", promptValue: "Áo bóng đá" },
    { key: "fashionStyles.male.basketball_jersey", promptValue: "Áo bóng rổ" },
    { key: "fashionStyles.male.male_ao_dai", promptValue: "Áo dài nam" },
    { key: "fashionStyles.male.male_ao_ba_ba", promptValue: "Áo bà ba nam" },
    { key: "fashionStyles.male.traditional_veston", promptValue: "Áo truyền thống veston" },
    { key: "fashionStyles.male.mandarin_collar_jacket", promptValue: "Áo cổ tàu nam" },
    { key: "fashionStyles.male.hawaiian_shirt", promptValue: "Áo sơ mi Hawaii" },
    { key: "fashionStyles.male.cuban_collar_shirt", promptValue: "Áo sơ mi Cuban cổ mở" },
    { key: "fashionStyles.male.pilot_jacket", promptValue: "Áo jacket phi công" },
    { key: "fashionStyles.male.turtleneck_sweater", promptValue: "Áo len cao cổ" },
    { key: "fashionStyles.male.sweater", promptValue: "Áo sweater nam" }
];
export const FASHION_GIRL_STYLES: FashionStyle[] = [
    { key: "fashionStyles.girl.princess_tshirt", promptValue: "Áo thun cotton in hình công chúa" },
    { key: "fashionStyles.girl.floral_tshirt", promptValue: "Áo thun cotton in hoa" },
    { key: "fashionStyles.girl.puffy_sleeve_tshirt", promptValue: "Áo thun tay bồng" },
    { key: "fashionStyles.girl.crop_top", promptValue: "Áo thun crop top trẻ em" },
    { key: "fashionStyles.girl.white_shirt", promptValue: "Áo sơ mi trắng bé gái" },
    { key: "fashionStyles.girl.plaid_shirt", promptValue: "Áo sơ mi caro hồng" },
    { key: "fashionStyles.girl.denim_shirt", promptValue: "Áo sơ mi denim" },
    { key: "fashionStyles.girl.lace_shirt", promptValue: "Áo sơ mi ren trẻ em" },
    { key: "fashionStyles.girl.pink_hoodie", promptValue: "Áo hoodie nỉ hồng" },
    { key: "fashionStyles.girl.cat_hoodie", promptValue: "Áo hoodie in mèo dễ thương" },
    { key: "fashionStyles.girl.mini_bomber_jacket", promptValue: "Áo khoác bomber mini" },
    { key: "fashionStyles.girl.jean_jacket", promptValue: "Áo khoác jean bé gái" },
    { key: "fashionStyles.girl.faux_leather_jacket", promptValue: "Áo khoác da giả" },
    { key: "fashionStyles.girl.pink_puffer_jacket", promptValue: "Áo khoác puffer hồng" },
    { key: "fashionStyles.girl.wool_cardigan", promptValue: "Áo khoác cardigan len" },
    { key: "fashionStyles.girl.patterned_sweater", promptValue: "Áo len hoa văn" },
    { key: "fashionStyles.girl.turtleneck_sweater", promptValue: "Áo len cổ lọ" },
    { key: "fashionStyles.girl.pastel_sweater", promptValue: "Áo sweater pastel" },
    { key: "fashionStyles.girl.floral_windbreaker", promptValue: "Áo khoác gió hoa" },
    { key: "fashionStyles.girl.raincoat", promptValue: "Áo khoác mưa trẻ em" },
    { key: "fashionStyles.girl.princess_dress", promptValue: "Váy công chúa xòe" },
    { key: "fashionStyles.girl.tutu_dress", promptValue: "Váy tutu nhiều tầng" },
    { key: "fashionStyles.girl.summer_dress", promptValue: "Váy hoa mùa hè" },
    { key: "fashionStyles.girl.straight_fit_dress", promptValue: "Váy liền dáng suông" },
    { key: "fashionStyles.girl.jean_dungaree_dress", promptValue: "Váy yếm jean" },
    { key: "fashionStyles.girl.linen_dungaree_dress", promptValue: "Váy yếm vải thô" },
    { key: "fashionStyles.girl.lace_dress", promptValue: "Váy ren bé gái" },
    { key: "fashionStyles.girl.polka_dot_dress", promptValue: "Váy chấm bi" },
    { key: "fashionStyles.girl.maxi_dress", promptValue: "Váy maxi trẻ em" },
    { key: "fashionStyles.girl.mini_wedding_dress", promptValue: "Váy cưới mini" },
    { key: "fashionStyles.girl.school_uniform", promptValue: "Váy đồng phục học sinh" },
    { key: "fashionStyles.girl.party_dress", promptValue: "Váy dạ hội nhí" },
    { key: "fashionStyles.girl.chiffon_princess_dress", promptValue: "Đầm voan công chúa" },
    { key: "fashionStyles.girl.bow_dress", promptValue: "Đầm xòe thắt nơ" },
    { key: "fashionStyles.girl.peplum_dress", promptValue: "Đầm peplum nhí" },
    { key: "fashionStyles.girl.babydoll_dress", promptValue: "Đầm babydoll" },
    { key: "fashionStyles.girl.short_set", promptValue: "Bộ đồ thun ngắn" },
    { key: "fashionStyles.girl.summer_cotton_set", promptValue: "Bộ đồ cotton mùa hè" },
    { key: "fashionStyles.girl.winter_long_sleeve_set", promptValue: "Bộ đồ dài tay mùa đông" },
    { key: "fashionStyles.girl.floral_pajamas", promptValue: "Bộ pijama hoa" },
    { key: "fashionStyles.girl.cartoon_pajamas", promptValue: "Bộ pijama hoạt hình" },
    { key: "fashionStyles.girl.sportswear_set", promptValue: "Bộ đồ thể thao bé gái" },
    { key: "fashionStyles.girl.dance_outfit", promptValue: "Bộ đồ nhảy hiện đại" },
    { key: "fashionStyles.girl.ballet_outfit", promptValue: "Bộ đồ múa ballet" },
    { key: "fashionStyles.girl.mini_gym_top", promptValue: "Áo tập gym mini" },
    { key: "fashionStyles.girl.tank_top", promptValue: "Áo tanktop trẻ em" },
    { key: "fashionStyles.girl.jean_shorts", promptValue: "Quần short jean" },
    { key: "fashionStyles.girl.floral_shorts", promptValue: "Quần short hoa" },
    { key: "fashionStyles.girl.khaki_shorts", promptValue: "Quần short kaki" },
    { key: "fashionStyles.girl.cotton_leggings", promptValue: "Quần legging cotton" },
    { key: "fashionStyles.girl.printed_leggings", promptValue: "Quần legging in hình" },
    { key: "fashionStyles.girl.joggers", promptValue: "Quần jogger bé gái" },
    { key: "fashionStyles.girl.trousers", promptValue: "Quần tây trẻ em" },
    { key: "fashionStyles.girl.jean_dungarees", promptValue: "Quần yếm jean" },
    { key: "fashionStyles.girl.floral_dungarees", promptValue: "Quần yếm hoa" },
    { key: "fashionStyles.girl.one_piece_swimsuit", promptValue: "Đồ bơi liền thân" },
    { key: "fashionStyles.girl.two_piece_swimsuit", promptValue: "Đồ bơi hai mảnh" },
    { key: "fashionStyles.girl.long_sleeve_swimsuit", promptValue: "Đồ bơi tay dài" },
    { key: "fashionStyles.girl.pink_swim_vest", promptValue: "Áo phao bơi hồng" },
    { key: "fashionStyles.girl.girls_raincoat", promptValue: "Áo mưa bé gái" },
    { key: "fashionStyles.girl.straw_hat", promptValue: "Nón cói trẻ em" },
    { key: "fashionStyles.girl.pink_bucket_hat", promptValue: "Nón bucket hồng" },
    { key: "fashionStyles.girl.cute_beanie", promptValue: "Nón len dễ thương" },
    { key: "fashionStyles.girl.mini_snapback", promptValue: "Nón snapback mini" },
    { key: "fashionStyles.girl.sneakers", promptValue: "Giày sneaker bé gái" },
    { key: "fashionStyles.girl.floral_sandals", promptValue: "Giày sandal hoa" },
    { key: "fashionStyles.girl.doll_shoes", promptValue: "Giày búp bê" },
    { key: "fashionStyles.girl.mini_sport_shoes", promptValue: "Giày thể thao mini" },
    { key: "fashionStyles.girl.pink_crocs", promptValue: "Dép Crocs hồng" },
    { key: "fashionStyles.girl.cartoon_slippers", promptValue: "Dép hoạt hình" },
    { key: "fashionStyles.girl.mini_princess_handbag", promptValue: "Túi xách mini công chúa" },
    { key: "fashionStyles.girl.cute_backpack", promptValue: "Ba lô dễ thương" }
];
export const FASHION_BOY_STYLES: FashionStyle[] = [
    { key: "fashionStyles.boy.plain_cotton_tshirt", promptValue: "Áo thun cotton trơn" },
    { key: "fashionStyles.boy.superhero_tshirt", promptValue: "Áo thun in siêu nhân" },
    { key: "fashionStyles.boy.dinosaur_tshirt", promptValue: "Áo thun in khủng long" },
    { key: "fashionStyles.boy.car_tshirt", promptValue: "Áo thun in ô tô" },
    { key: "fashionStyles.boy.polo_shirt", promptValue: "Áo thun polo trẻ em" },
    { key: "fashionStyles.boy.plaid_shirt", promptValue: "Áo sơ mi caro bé trai" },
    { key: "fashionStyles.boy.white_shirt", promptValue: "Áo sơ mi trắng bé trai" },
    { key: "fashionStyles.boy.jean_shirt", promptValue: "Áo sơ mi jean" },
    { key: "fashionStyles.boy.striped_shirt", promptValue: "Áo sơ mi kẻ sọc nhỏ" },
    { key: "fashionStyles.boy.fleece_hoodie", promptValue: "Áo hoodie nỉ trẻ em" },
    { key: "fashionStyles.boy.cartoon_hoodie", promptValue: "Áo hoodie in hoạt hình" },
    { key: "fashionStyles.boy.mini_bomber_jacket", promptValue: "Áo khoác bomber mini" },
    { key: "fashionStyles.boy.jean_jacket", promptValue: "Áo khoác jean bé trai" },
    { key: "fashionStyles.boy.faux_leather_jacket", promptValue: "Áo khoác da giả" },
    { key: "fashionStyles.boy.puffer_jacket", promptValue: "Áo khoác puffer" },
    { key: "fashionStyles.boy.light_windbreaker", promptValue: "Áo khoác gió mỏng" },
    { key: "fashionStyles.boy.crew_neck_sweater", promptValue: "Áo len cổ tròn" },
    { key: "fashionStyles.boy.striped_sweater", promptValue: "Áo len kẻ ngang" },
    { key: "fashionStyles.boy.turtleneck_sweater", promptValue: "Áo len cao cổ bé trai" },
    { key: "fashionStyles.boy.wool_cardigan", promptValue: "Áo cardigan len" },
    { key: "fashionStyles.boy.sporty_sweater", promptValue: "Áo sweater thể thao" },
    { key: "fashionStyles.boy.football_jersey", promptValue: "Áo bóng đá trẻ em" },
    { key: "fashionStyles.boy.basketball_jersey", promptValue: "Áo bóng rổ trẻ em" },
    { key: "fashionStyles.boy.sport_polo", promptValue: "Áo polo thể thao" },
    { key: "fashionStyles.boy.cotton_sport_set", promptValue: "Bộ đồ thể thao cotton" },
    { key: "fashionStyles.boy.fleece_tracksuit", promptValue: "Bộ nỉ dài tay" },
    { key: "fashionStyles.boy.club_football_kit", promptValue: "Bộ đồ bóng đá CLB" },
    { key: "fashionStyles.boy.nba_kids_kit", promptValue: "Bộ đồ bóng rổ NBA kids" },
    { key: "fashionStyles.boy.tank_top", promptValue: "Áo tanktop bé trai" },
    { key: "fashionStyles.boy.jean_shorts", promptValue: "Quần short jean" },
    { key: "fashionStyles.boy.khaki_shorts", promptValue: "Quần short kaki" },
    { key: "fashionStyles.boy.sport_shorts", promptValue: "Quần short thể thao" },
    { key: "fashionStyles.boy.printed_cotton_shorts", promptValue: "Quần short cotton in hình" },
    { key: "fashionStyles.boy.jersey_joggers", promptValue: "Quần jogger thun" },
    { key: "fashionStyles.boy.fleece_joggers", promptValue: "Quần jogger nỉ" },
    { key: "fashionStyles.boy.slimfit_jeans", promptValue: "Quần jeans slimfit" },
    { key: "fashionStyles.boy.lightly_ripped_jeans", promptValue: "Quần jeans rách nhẹ" },
    { key: "fashionStyles.boy.baggy_jeans_kids", promptValue: "Quần jeans baggy kids" },
    { key: "fashionStyles.boy.trousers", promptValue: "Quần tây bé trai" },
    { key: "fashionStyles.boy.chinos", promptValue: "Quần chinos trẻ em" },
    { key: "fashionStyles.boy.jean_dungarees", promptValue: "Quần yếm jean" },
    { key: "fashionStyles.boy.linen_dungarees", promptValue: "Quần yếm vải thô" },
    { key: "fashionStyles.boy.suit_set", promptValue: "Bộ vest bé trai" },
    { key: "fashionStyles.boy.tuxedo_set", promptValue: "Bộ tuxedo bé trai" },
    { key: "fashionStyles.boy.mini_wedding_suit", promptValue: "Bộ vest cưới nhí" },
    { key: "fashionStyles.boy.performance_outfit", promptValue: "Bộ đồ diễn bé trai" },
    { key: "fashionStyles.boy.superhero_costume", promptValue: "Bộ đồ hoá trang siêu nhân" },
    { key: "fashionStyles.boy.pilot_costume", promptValue: "Bộ đồ hoá trang phi công" },
    { key: "fashionStyles.boy.cotton_pajamas", promptValue: "Bộ pyjama cotton" },
    { key: "fashionStyles.boy.cartoon_pajamas", promptValue: "Bộ pyjama hoạt hình" },
    { key: "fashionStyles.boy.plaid_pajamas", promptValue: "Bộ pyjama kẻ caro" },
    { key: "fashionStyles.boy.summer_pajamas", promptValue: "Bộ pijama mùa hè" },
    { key: "fashionStyles.boy.one_piece_swimsuit", promptValue: "Đồ bơi liền thân bé trai" },
    { key: "fashionStyles.boy.swim_shorts", promptValue: "Đồ bơi quần short" },
    { key: "fashionStyles.boy.long_sleeve_swimsuit", promptValue: "Đồ bơi tay dài" },
    { key: "fashionStyles.boy.swim_vest", promptValue: "Áo phao bơi trẻ em" },
    { key: "fashionStyles.boy.raincoat", promptValue: "Áo mưa trẻ em" },
    { key: "fashionStyles.boy.baseball_cap", promptValue: "Nón lưỡi trai" },
    { key: "fashionStyles.boy.bucket_hat", promptValue: "Nón bucket trẻ em" },
    { key: "fashionStyles.boy.beanie", promptValue: "Nón len" },
    { key: "fashionStyles.boy.snapback", promptValue: "Nón snapback" },
    { key: "fashionStyles.boy.sneakers", promptValue: "Giày sneaker trẻ em" },
    { key: "fashionStyles.boy.sandals", promptValue: "Giày sandal bé trai" },
    { key: "fashionStyles.boy.mini_sport_shoes", promptValue: "Giày thể thao mini" },
    { key: "fashionStyles.boy.boots", promptValue: "Giày boot bé trai" },
    { key: "fashionStyles.boy.cartoon_slippers", promptValue: "Dép lê hoạt hình" },
    { key: "fashionStyles.boy.crocs", promptValue: "Dép Crocs trẻ em" },
    { key: "fashionStyles.boy.cartoon_backpack", promptValue: "Ba lô hoạt hình bé trai" },
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
    highQuality: false
};