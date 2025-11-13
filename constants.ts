import type { Settings, HeadshotStyle, AspectRatio, FashionAspectRatio, FashionStyle, BeautyFeature, BeautyStyle } from './types';

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


// --- BEAUTY STUDIO CONSTANTS ---
const genericIconUrl = "fa-solid fa-palette";

const intensityStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'intensity', value: 'None' },
    { id: 'light', labelKey: 'beautyStudio.styles.light', englishLabel: 'Light', type: 'intensity', value: 'Light' },
    { id: 'medium', labelKey: 'beautyStudio.styles.medium', englishLabel: 'Medium', type: 'intensity', value: 'Medium' },
    { id: 'strong', labelKey: 'beautyStudio.styles.strong', englishLabel: 'Strong', type: 'intensity', value: 'Strong' },
];

const smileStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'intensity', value: 'None', promptInstruction: "Keep the original expression." },
    { id: 'subtle', labelKey: 'beautyStudio.styles.subtle', englishLabel: 'Subtle Lift', type: 'intensity', value: 'Subtle', promptInstruction: "Slightly lift the corners of the mouth for a subtle, gentle smile." },
    { id: 'gentle', labelKey: 'beautyStudio.styles.gentle', englishLabel: 'Gentle Smile', type: 'intensity', value: 'Gentle', promptInstruction: "Create a soft, gentle, closed-mouth smile." },
    { id: 'joyful', labelKey: 'beautyStudio.styles.joyful', englishLabel: 'Joyful Beam', type: 'intensity', value: 'Joyful', promptInstruction: "Create a bright, joyful, happy smile, showing teeth naturally." },
];

const appleLightingStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
    { id: 'natural', labelKey: 'beautyStudio.styles.natural', englishLabel: 'Natural Light', type: 'image', value: genericIconUrl, promptInstruction: "Relight the portrait with soft, natural daylight, as if taken near a large window." },
    { id: 'studio', labelKey: 'beautyStudio.styles.studio', englishLabel: 'Studio Light', type: 'image', value: genericIconUrl, promptInstruction: "Apply professional studio lighting with a key light and fill light to create a clean, polished look." },
    { id: 'dramatic', labelKey: 'beautyStudio.styles.dramatic', englishLabel: 'Dramatic', type: 'image', value: genericIconUrl, promptInstruction: "Apply dramatic, high-contrast lighting like Rembrandt or split lighting to create a moody, artistic portrait." },
];

const filmStockStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
    { id: 'fuji', labelKey: 'beautyStudio.styles.fuji', englishLabel: 'Fuji Velvia', type: 'image', value: genericIconUrl, promptInstruction: "Apply a color grade that mimics the vibrant, saturated colors and high contrast of Fuji Velvia film." },
    { id: 'kodak', labelKey: 'beautyStudio.styles.kodak', englishLabel: 'Kodak Portra', type: 'image', value: genericIconUrl, promptInstruction: "Apply a color grade that mimics the warm tones and natural skin tones of Kodak Portra film." },
    { id: 'agfa', labelKey: 'beautyStudio.styles.agfa', englishLabel: 'Agfa Vista', type: 'image', value: genericIconUrl, promptInstruction: "Apply a color grade that mimics the rich, warm reds and distinct grain of Agfa Vista film." },
];

const flashTypeStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
    { id: 'direct', labelKey: 'beautyStudio.styles.direct', englishLabel: 'Direct Flash', type: 'image', value: genericIconUrl, promptInstruction: "Simulate a direct, on-camera flash effect with harsh shadows and bright highlights for a 'paparazzi' look." },
    { id: 'ring', labelKey: 'beautyStudio.styles.ring', englishLabel: 'Ring Flash', type: 'image', value: genericIconUrl, promptInstruction: "Simulate a ring flash effect, creating a characteristic circular catchlight in the eyes and flat, even lighting." },
    { id: 'soft', labelKey: 'beautyStudio.styles.soft', englishLabel: 'Soft Bounce', type: 'image', value: genericIconUrl, promptInstruction: "Simulate a soft, bounced flash effect, with diffused light and soft shadows for a flattering portrait." },
];

const flashGelStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'color', value: 'transparent' },
    { id: 'warm', labelKey: 'beautyStudio.styles.warm', englishLabel: 'Warm Gel', type: 'color', value: '#FFDDC1', promptInstruction: "Apply a warm, orange-toned color gel effect over the flash lighting." },
    { id: 'cool', labelKey: 'beautyStudio.styles.cool', englishLabel: 'Cool Gel', type: 'color', value: '#D6EAF8', promptInstruction: "Apply a cool, blue-toned color gel effect over the flash lighting." },
    { id: 'red', labelKey: 'beautyStudio.styles.red', englishLabel: 'Red Gel', type: 'color', value: '#FADBD8', promptInstruction: "Apply a vibrant, red-toned color gel effect over the flash lighting." },
];

const seasonalFilterStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
    { id: 'spring', labelKey: 'beautyStudio.styles.spring', englishLabel: 'Spring', type: 'image', value: genericIconUrl, promptInstruction: "Apply a 'Spring' color grade with fresh greens, soft pastels, and bright, airy light." },
    { id: 'summer', labelKey: 'beautyStudio.styles.summer', englishLabel: 'Summer', type: 'image', value: genericIconUrl, promptInstruction: "Apply a 'Summer' color grade with warm, golden tones, vibrant colors, and high contrast." },
    { id: 'autumn', labelKey: 'beautyStudio.styles.autumn', englishLabel: 'Autumn', type: 'image', value: genericIconUrl, promptInstruction: "Apply an 'Autumn' color grade with rich oranges, reds, and browns, and a soft, warm light." },
    { id: 'winter', labelKey: 'beautyStudio.styles.winter', englishLabel: 'Winter', type: 'image', value: genericIconUrl, promptInstruction: "Apply a 'Winter' color grade with cool, blue tones, muted colors, and a crisp, clean light." },
];

const idPhotoBgStyles: BeautyStyle[] = [
    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'color', value: 'transparent' },
    { id: 'white', labelKey: 'beautyStudio.styles.white', englishLabel: 'White', type: 'color', value: '#FFFFFF', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid white background suitable for an ID photo." },
    { id: 'blue', labelKey: 'beautyStudio.styles.blue', englishLabel: 'Blue', type: 'color', value: '#E1F5FE', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid light blue background suitable for an ID photo." },
    { id: 'gray', labelKey: 'beautyStudio.styles.gray', englishLabel: 'Gray', type: 'color', value: '#EEEEEE', promptInstruction: "Carefully cut out the main subject and place them on a clean, solid light gray background suitable for an ID photo." },
];

const skinTonePresetStyles: BeautyStyle[] = [
  { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
  { id: 'porcelainCool', labelKey: 'beautyStudio.styles.porcelainCool', englishLabel: 'Porcelain Cool', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a cool porcelain shade." },
  { id: 'fairNeutral', labelKey: 'beautyStudio.styles.fairNeutral', englishLabel: 'Fair Neutral', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a neutral fair shade." },
  { id: 'lightWarm', labelKey: 'beautyStudio.styles.lightWarm', englishLabel: 'Light Warm', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a warm light shade." },
  { id: 'mediumNeutral', labelKey: 'beautyStudio.styles.mediumNeutral', englishLabel: 'Medium Neutral', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a neutral medium shade." },
  { id: 'oliveNeutral', labelKey: 'beautyStudio.styles.oliveNeutral', englishLabel: 'Olive Neutral', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a neutral olive shade." },
  { id: 'tanGolden', labelKey: 'beautyStudio.styles.tanGolden', englishLabel: 'Tan Golden', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a golden tan shade." },
  { id: 'deepWarm', labelKey: 'beautyStudio.styles.deepWarm', englishLabel: 'Deep Warm', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a warm deep shade." },
  { id: 'richNeutral', labelKey: 'beautyStudio.styles.richNeutral', englishLabel: 'Rich Neutral', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a neutral rich shade." },
  { id: 'espressoCool', labelKey: 'beautyStudio.styles.espressoCool', englishLabel: 'Espresso Cool', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a cool espresso shade." },
  { id: 'rosyLight', labelKey: 'beautyStudio.styles.rosyLight', englishLabel: 'Rosy Light', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a light rosy shade." },
  { id: 'goldenMedium', labelKey: 'beautyStudio.styles.goldenMedium', englishLabel: 'Golden Medium', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a medium golden shade." },
  { id: 'coolTan', labelKey: 'beautyStudio.styles.coolTan', englishLabel: 'Cool Tan', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a cool tan shade." },
  { id: 'warmRich', labelKey: 'beautyStudio.styles.warmRich', englishLabel: 'Warm Rich', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a rich warm shade." },
  { id: 'neutralDeep', labelKey: 'beautyStudio.styles.neutralDeep', englishLabel: 'Neutral Deep', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a deep neutral shade." },
  { id: 'peach', labelKey: 'beautyStudio.styles.peach', englishLabel: 'Peach', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a peach shade." },
  { id: 'sand', labelKey: 'beautyStudio.styles.sand', englishLabel: 'Sand', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a sand shade." },
  { id: 'caramel', labelKey: 'beautyStudio.styles.caramel', englishLabel: 'Caramel', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a caramel shade." },
  { id: 'almond', labelKey: 'beautyStudio.styles.almond', englishLabel: 'Almond', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to an almond shade." },
  { id: 'mahogany', labelKey: 'beautyStudio.styles.mahogany', englishLabel: 'Mahogany', type: 'image', value: genericIconUrl, promptInstruction: "Adjust skin tone to a mahogany shade." },
];


export const BEAUTY_FEATURES: BeautyFeature[] = [
    {
        id: 'apple_mode', labelKey: 'beautyStudio.tools.apple_mode', englishLabel: 'Apple Mode', icon: "fa-solid fa-lightbulb",
        subFeatures: [
            { id: 'lighting', labelKey: 'beautyStudio.subfeatures.lighting', englishLabel: 'Lighting', styles: appleLightingStyles },
            { id: 'color_profile', labelKey: 'beautyStudio.subfeatures.color_profile', englishLabel: 'Color Profile', styles: intensityStyles },
        ]
    },
    {
        id: 'camera_film', labelKey: 'beautyStudio.tools.camera_film', englishLabel: 'Camera Film', icon: "fa-solid fa-film",
        subFeatures: [
            { id: 'film_stock', labelKey: 'beautyStudio.subfeatures.film_stock', englishLabel: 'Film Stock', styles: filmStockStyles },
            { id: 'grain', labelKey: 'beautyStudio.subfeatures.grain', englishLabel: 'Grain', styles: intensityStyles },
        ]
    },
    {
        id: 'flash', labelKey: 'beautyStudio.tools.flash', englishLabel: 'Flash Camera', icon: "fa-solid fa-bolt",
        subFeatures: [
            { id: 'flash_type', labelKey: 'beautyStudio.subfeatures.flash_type', englishLabel: 'Flash Type', styles: flashTypeStyles },
            { id: 'color_gel', labelKey: 'beautyStudio.subfeatures.color_gel', englishLabel: 'Color Gel', styles: flashGelStyles },
        ]
    },
    {
        id: 'ai_filter', labelKey: 'beautyStudio.tools.ai_filter', englishLabel: 'AI Filter', badge: 'Hot', icon: "fa-solid fa-wand-magic-sparkles",
        subFeatures: [
            { id: 'seasonal', labelKey: 'beautyStudio.subfeatures.seasonal', englishLabel: 'Seasonal', styles: seasonalFilterStyles },
            { id: 'artistic', labelKey: 'beautyStudio.subfeatures.artistic', englishLabel: 'Artistic', styles: [
                { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                { id: 'cartoon', labelKey: 'beautyStudio.styles.cartoon', englishLabel: 'Cartoon', type: 'image', value: genericIconUrl, promptInstruction: "Redraw the photo in a vibrant cartoon style." },
                { id: 'oil_painting', labelKey: 'beautyStudio.styles.oil_painting', englishLabel: 'Oil Painting', type: 'image', value: genericIconUrl, promptInstruction: "Transform the photo into a classical oil painting." },
                { id: 'pencil_sketch', labelKey: 'beautyStudio.styles.pencil_sketch', englishLabel: 'Pencil Sketch', type: 'image', value: genericIconUrl, promptInstruction: "Convert the photo into a detailed pencil sketch." },
            ] },
        ]
    },
    {
        id: 'hd_quality', labelKey: 'beautyStudio.tools.hd_quality', englishLabel: 'Image Quality', icon: "fa-solid fa-star", badge: 'NEW',
        subFeatures: [
            {
                id: 'enhancement_level', labelKey: 'beautyStudio.subfeatures.enhancement_level', englishLabel: 'Enhancement Level',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'intensity', value: 'None' },
                    { id: 'hd', labelKey: 'beautyStudio.styles.hd', englishLabel: 'Sharpen HD', type: 'intensity', value: 'HD', promptInstruction: "Enhance the image to HD quality, improving sharpness and clarity." },
                    { id: 'upscale', labelKey: 'beautyStudio.styles.upscale', englishLabel: '4K Upscale', type: 'intensity', value: '4K', promptInstruction: "Upscale the image to 4K resolution, intelligently adding detail and refining textures for a high-definition result." },
                    { id: 'denoise', labelKey: 'beautyStudio.styles.denoise', englishLabel: 'Denoise', type: 'intensity', value: 'Denoise', promptInstruction: "Apply noise reduction to the image, smoothing out grain while preserving important details." },
                ]
            }
        ]
    },
    {
        id: 'beautify', labelKey: 'beautyStudio.tools.beautify', englishLabel: 'Beautify', icon: "fa-solid fa-paintbrush", badge: 'Hot',
        subFeatures: [
            { id: 'remove_oil', labelKey: 'beautyStudio.subfeatures.remove_oil', englishLabel: 'Remove Oiliness', styles: intensityStyles, promptInstruction: "Reduce shine and oiliness on the skin to a '{{style}}' degree for a more matte finish." },
            { id: 'slim_face', labelKey: 'beautyStudio.subfeatures.slim_face', englishLabel: 'Slim Face', styles: intensityStyles, promptInstruction: "Realistically and subtly slim the subject's face, focusing on the jawline and cheeks. Apply the effect to a '{{style}}' degree." },
            {
                id: 'skin_tone', labelKey: 'beautyStudio.subfeatures.skin_tone', englishLabel: 'Skin Tone',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'ivory', labelKey: 'beautyStudio.styles.ivory', englishLabel: 'Fair Ivory', type: 'color', value: '#FFFAF0', promptInstruction: "Adjust the skin tone to a 'Fair Ivory' shade." },
                    { id: 'beige', labelKey: 'beautyStudio.styles.beige', englishLabel: 'Natural Beige', type: 'color', value: '#F5DEB3', promptInstruction: "Adjust the skin tone to a 'Natural Beige' shade." },
                    { id: 'honey', labelKey: 'beautyStudio.styles.honey', englishLabel: 'Warm Honey', type: 'color', value: '#D2A679', promptInstruction: "Adjust the skin tone to a 'Warm Honey' shade." },
                    { id: 'bronze', labelKey: 'beautyStudio.styles.bronze', englishLabel: 'Sun-kissed Bronze', type: 'color', value: '#A0522D', promptInstruction: "Adjust the skin tone to a 'Sun-kissed Bronze' shade." },
                ]
            },
            { id: 'expression_sub', labelKey: 'beautyStudio.subfeatures.expression_sub', englishLabel: 'Smile Adjustment', styles: smileStyles, promptInstruction: "Adjust the person's expression to create a '{{style}}'." },
            {
                id: '3d_lighting', labelKey: 'beautyStudio.subfeatures.3d_lighting', englishLabel: '3D Lighting',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'natural', labelKey: 'beautyStudio.styles.soft_natural', englishLabel: 'Soft Natural', type: 'image', value: genericIconUrl, promptInstruction: "Apply a soft, natural 3D lighting effect to enhance facial features." },
                    { id: 'studio', labelKey: 'beautyStudio.styles.bright_studio', englishLabel: 'Bright Studio', type: 'image', value: genericIconUrl, promptInstruction: "Apply a bright, professional studio lighting effect to the portrait." },
                    { id: 'contour', labelKey: 'beautyStudio.styles.dramatic_contour', englishLabel: 'Dramatic Contour', type: 'image', value: genericIconUrl, promptInstruction: "Apply dramatic contour lighting to sculpt and define the facial features." },
                    { id: 'golden_hour', labelKey: 'beautyStudio.styles.golden_hour', englishLabel: 'Golden Hour', type: 'image', value: genericIconUrl, promptInstruction: "Relight the portrait with the warm, soft glow of a 'Golden Hour' sunset." },
                ]
            },
            { id: 'face_lift', labelKey: 'beautyStudio.subfeatures.face_lift', englishLabel: 'Face Lift', styles: intensityStyles, promptInstruction: "Apply a subtle digital face lift effect, tightening the jawline and brow area to a '{{style}}' degree." },
            { id: 'acne_removal', labelKey: 'beautyStudio.subfeatures.acne_removal', englishLabel: 'Acne Removal', styles: intensityStyles, promptInstruction: "Remove acne and skin blemishes with a '{{style}}' intensity, ensuring the skin texture looks natural." },
            { id: 'remove_double_chin', labelKey: 'beautyStudio.subfeatures.remove_double_chin', englishLabel: 'Remove Double Chin', styles: intensityStyles, promptInstruction: "Reduce or remove the appearance of a double chin to a '{{style}}' degree, defining the jawline." },
            { id: 'remove_dark_circles', labelKey: 'beautyStudio.subfeatures.remove_dark_circles', englishLabel: 'Remove Dark Circles', styles: intensityStyles, promptInstruction: "Reduce the appearance of dark circles under the eyes with a '{{style}}' intensity." },
            { id: 'teeth_whitening', labelKey: 'beautyStudio.subfeatures.teeth_whitening', englishLabel: 'Teeth Whitening', styles: intensityStyles, promptInstruction: "Whiten the teeth to a '{{style}}' degree, making sure they look bright but natural." },
        ]
    },
    {
        id: 'skin_tone_adjustment', labelKey: 'beautyStudio.tools.skin_tone_adjustment', englishLabel: 'Skin Tone Adjustment', icon: "fa-solid fa-palette",
        subFeatures: [
            { id: 'skin_tone_presets', labelKey: 'beautyStudio.subfeatures.skin_tone_presets', englishLabel: 'Presets', styles: skinTonePresetStyles }
        ]
    },
    {
        id: 'remove_bg', labelKey: 'beautyStudio.tools.remove_bg', englishLabel: 'Remove Background', icon: "fa-regular fa-object-ungroup", badge: 'NEW',
        subFeatures: [
            {
              id: 'replace_background', labelKey: 'beautyStudio.subfeatures.replace_background', englishLabel: 'Replace Background',
              styles: [
                  { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                  { id: 'transparent', labelKey: 'beautyStudio.styles.transparent', englishLabel: 'Transparent', type: 'image', value: genericIconUrl, promptInstruction: "Carefully cut out the main subject from the photo and place it on a transparent background." },
                  { id: 'white', labelKey: 'beautyStudio.styles.white', englishLabel: 'White', type: 'image', value: genericIconUrl, promptInstruction: "Carefully cut out the main subject from the photo and place it on a clean, solid white background." },
                  { id: 'city', labelKey: 'beautyStudio.styles.city', englishLabel: 'City', type: 'image', value: genericIconUrl, promptInstruction: "Carefully cut out the main subject from the photo and place them on a realistic, slightly blurred city street background." },
              ]
            }
        ]
    },
    {
        id: 'ai_portrait', labelKey: 'beautyStudio.tools.ai_portrait', englishLabel: 'AI Portrait', icon: "fa-solid fa-user-astronaut",
        subFeatures: [
            {
                id: 'style', labelKey: 'beautyStudio.subfeatures.style', englishLabel: 'Style',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'classic', labelKey: 'beautyStudio.styles.classic', englishLabel: 'Classic', type: 'image', value: genericIconUrl, promptInstruction: "Transform the photo into a classic, timeless portrait." },
                    { id: 'cartoon', labelKey: 'beautyStudio.styles.cartoon', englishLabel: 'Cartoon', type: 'image', value: genericIconUrl, promptInstruction: "Redraw the portrait in a vibrant cartoon style." },
                    { id: 'oil_painting', labelKey: 'beautyStudio.styles.oil_painting', englishLabel: 'Oil Painting', type: 'image', value: genericIconUrl, promptInstruction: "Transform the portrait into a classical oil painting." },
                    { id: 'pencil_sketch', labelKey: 'beautyStudio.styles.pencil_sketch', englishLabel: 'Pencil Sketch', type: 'image', value: genericIconUrl, promptInstruction: "Convert the portrait into a detailed pencil sketch." },
                    { id: 'watercolor', labelKey: 'beautyStudio.styles.watercolor', englishLabel: 'Watercolor', type: 'image', value: genericIconUrl, promptInstruction: "Recreate the portrait in a soft and flowing watercolor style." },
                    { id: 'pop_art', labelKey: 'beautyStudio.styles.pop_art', englishLabel: 'Pop Art', type: 'image', value: genericIconUrl, promptInstruction: "Reimagine the portrait in a bold and colorful Pop Art style, reminiscent of Andy Warhol." },
                    { id: 'cyberpunk', labelKey: 'beautyStudio.styles.cyberpunk', englishLabel: 'Cyberpunk', type: 'image', value: genericIconUrl, promptInstruction: "Transform the portrait into a futuristic, neon-lit Cyberpunk style." },
                ]
            }
        ]
    },
    {
        id: 'hair', labelKey: 'beautyStudio.tools.hair', englishLabel: 'Hair', icon: "fa-solid fa-khanda",
        subFeatures: [
            {
                id: 'dye', labelKey: 'beautyStudio.subfeatures.dye', englishLabel: 'Dye',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'honey_brown', labelKey: 'beautyStudio.styles.honey_brown', englishLabel: 'Honey Brown', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a warm 'Honey Brown'." },
                    { id: 'teddy_blonde', labelKey: 'beautyStudio.styles.teddy_blonde', englishLabel: 'Teddy Blonde', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a 'Teddy Blonde' shade." },
                    { id: 'cool_tone', labelKey: 'beautyStudio.styles.cool_tone', englishLabel: 'Cool Tone', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a 'Cool Tone' brown." },
                    { id: 'leopard', labelKey: 'beautyStudio.styles.leopard', englishLabel: 'Leopard', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a 'Leopard' print style." },
                    { id: 'orange_streaks', labelKey: 'beautyStudio.styles.orange_streaks', englishLabel: 'Orange Streaks', type: 'image', value: genericIconUrl, promptInstruction: "Add 'Orange Streaks' to the hair." },
                    { id: 'red_bangs', labelKey: 'beautyStudio.styles.red_bangs', englishLabel: 'Red Bangs', type: 'image', value: genericIconUrl, promptInstruction: "Add 'Red Streaks' to the bangs." },
                    { id: 'charcoal', labelKey: 'beautyStudio.styles.charcoal', englishLabel: 'Charcoal', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to 'Charcoal'." },
                    { id: 'ash_gray', labelKey: 'beautyStudio.styles.ash_gray', englishLabel: 'Ash Gray', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a trendy 'Ash Gray'." },
                    { id: 'pastel_pink', labelKey: 'beautyStudio.styles.pastel_pink', englishLabel: 'Pastel Pink', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a soft 'Pastel Pink'." },
                    { id: 'electric_blue', labelKey: 'beautyStudio.styles.electric_blue', englishLabel: 'Electric Blue', type: 'image', value: genericIconUrl, promptInstruction: "Change the hair color to a vivid 'Electric Blue'." },
                ]
            },
            {
                id: 'hair_style', labelKey: 'beautyStudio.subfeatures.hair_style', englishLabel: 'Hairstyle',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'long_wavy', labelKey: 'beautyStudio.styles.long_wavy', englishLabel: 'Long Wavy', type: 'image', value: genericIconUrl, promptInstruction: "Change the hairstyle to long and wavy." },
                    { id: 'sleek_ponytail', labelKey: 'beautyStudio.styles.sleek_ponytail', englishLabel: 'Sleek Ponytail', type: 'image', value: genericIconUrl, promptInstruction: "Change the hairstyle to a sleek ponytail." },
                    { id: 'pixie_cut', labelKey: 'beautyStudio.styles.pixie_cut', englishLabel: 'Pixie Cut', type: 'image', value: genericIconUrl, promptInstruction: "Change the hairstyle to a short pixie cut." },
                    { id: 'messy_bun', labelKey: 'beautyStudio.styles.messy_bun', englishLabel: 'Messy Bun', type: 'image', value: genericIconUrl, promptInstruction: "Change the hairstyle to a casual messy bun." },
                ]
            },
        ]
    },
    {
        id: 'expand_bg', labelKey: 'beautyStudio.tools.expand_bg', englishLabel: 'Expand Background', icon: "fa-solid fa-expand",
        promptInstruction: "You are an AI with outpainting capabilities. Expand the background of the image to a '{{style}}' aspect ratio using a content-aware fill that seamlessly matches the original image's style, lighting, and content.",
        subFeatures: [
            { id: 'ratio', labelKey: 'beautyStudio.subfeatures.ratio', englishLabel: 'Aspect Ratio', styles: [
                { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'intensity', value: 'None' },
                { id: 'square', labelKey: 'beautyStudio.styles.square', englishLabel: 'Square 1:1', type: 'intensity', value: '1:1' },
                { id: 'portrait', labelKey: 'beautyStudio.styles.portrait', englishLabel: 'Portrait 4:5', type: 'intensity', value: '4:5' },
                { id: 'story', labelKey: 'beautyStudio.styles.story', englishLabel: 'Story 9:16', type: 'intensity', value: '9:16' },
            ]},
        ]
    },
    {
        id: 'expression', labelKey: 'beautyStudio.tools.expression', englishLabel: 'Expression', icon: "fa-regular fa-face-smile",
        subFeatures: [
            {
                id: 'emotion', labelKey: 'beautyStudio.subfeatures.emotion', englishLabel: 'Emotion',
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'happy', labelKey: 'beautyStudio.styles.happy', englishLabel: 'Happy', type: 'image', value: genericIconUrl, promptInstruction: "Modify the person's expression to be genuinely happy, with a natural smile." },
                    { id: 'wink', labelKey: 'beautyStudio.styles.wink', englishLabel: 'Wink', type: 'image', value: genericIconUrl, promptInstruction: "Modify the person's expression to give a playful wink." },
                    { id: 'surprised', labelKey: 'beautyStudio.styles.surprised', englishLabel: 'Surprised', type: 'image', value: genericIconUrl, promptInstruction: "Modify the person's expression to look surprised." },
                    { id: 'sultry', labelKey: 'beautyStudio.styles.sultry', englishLabel: 'Sultry', type: 'image', value: genericIconUrl, promptInstruction: "Modify the person's expression to be sultry and alluring." },
                ]
            }
        ]
    },
    {
        id: 'id_photo', labelKey: 'beautyStudio.tools.id_photo', englishLabel: 'ID Photo', icon: "fa-regular fa-id-card",
        subFeatures: [
            { id: 'background_color', labelKey: 'beautyStudio.subfeatures.background_color', englishLabel: 'Background Color', styles: idPhotoBgStyles },
        ]
    },
    {
        id: 'makeup', labelKey: 'beautyStudio.tools.makeup', englishLabel: 'Makeup', icon: "fa-solid fa-lips",
        subFeatures: [
            {
                id: 'lipstick', labelKey: 'beautyStudio.subfeatures.lipstick', englishLabel: 'Lipstick',
                promptInstruction: "Apply a '{{style}}' colored lipstick to the lips.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'rd01', labelKey: 'beautyStudio.styles.rd01', englishLabel: 'RD01 Red', type: 'color', value: '#C7383B' },
                    { id: 'pk04', labelKey: 'beautyStudio.styles.pk04', englishLabel: 'PK04 Pink', type: 'color', value: '#E87A7D' },
                    { id: 'pk01', labelKey: 'beautyStudio.styles.pk01', englishLabel: 'PK01 Light Pink', type: 'color', value: '#EA89A0' },
                    { id: 'pk03', labelKey: 'beautyStudio.styles.pk03', englishLabel: 'PK03 Deep Pink', type: 'color', value: '#E9527E' },
                    { id: 'or01', labelKey: 'beautyStudio.styles.or01', englishLabel: 'OR01 Orange', type: 'color', value: '#E26D4F' },
                    { id: 'cr01', labelKey: 'beautyStudio.styles.cr01', englishLabel: 'CR01 Coral', type: 'color', value: '#E58572' },
                    { id: 'rd03', labelKey: 'beautyStudio.styles.rd03', englishLabel: 'RD03 Deep Red', type: 'color', value: '#B92B27' },
                    { id: 'vl04', labelKey: 'beautyStudio.styles.vl04', englishLabel: 'VL04 Violet', type: 'color', value: '#D0A9C5' },
                    { id: 'br01', labelKey: 'beautyStudio.styles.br01', englishLabel: 'BR01 Brown', type: 'color', value: '#A15F54' },
                    { id: 'pk05', labelKey: 'beautyStudio.styles.pk05', englishLabel: 'PK05 Fuchsia', type: 'color', value: '#D94A8C' },
                    { id: 'nude_beige', labelKey: 'beautyStudio.styles.nude_beige', englishLabel: 'Nude Beige', type: 'color', value: '#C9A995' },
                    { id: 'dusty_rose', labelKey: 'beautyStudio.styles.dusty_rose', englishLabel: 'Dusty Rose', type: 'color', value: '#B56B73' },
                    { id: 'berry_plum', labelKey: 'beautyStudio.styles.berry_plum', englishLabel: 'Berry Plum', type: 'color', value: '#8E3A59' },
                ]
            },
            {
                id: 'blush', labelKey: 'beautyStudio.subfeatures.blush', englishLabel: 'Blush',
                promptInstruction: "Apply a '{{style}}' colored blush to the cheeks.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'color', value: 'transparent' },
                    { id: 'rd01_blush', labelKey: 'beautyStudio.styles.rd01_blush', englishLabel: 'RD01 Red', type: 'color', value: '#E88B8C' },
                    { id: 'br01_blush', labelKey: 'beautyStudio.styles.br01_blush', englishLabel: 'BR01 Brown', type: 'color', value: '#D4A392' },
                    { id: 'pk01_blush', labelKey: 'beautyStudio.styles.pk01_blush', englishLabel: 'PK01 Pink', type: 'color', value: '#F0A2B1' },
                    { id: 'vl01_blush', labelKey: 'beautyStudio.styles.vl01_blush', englishLabel: 'VL01 Violet', type: 'color', value: '#D6A6C7' },
                    { id: 'nd01_blush', labelKey: 'beautyStudio.styles.nd01_blush', englishLabel: 'ND01 Nude', type: 'color', value: '#E6A89A' },
                    { id: 'or01_blush', labelKey: 'beautyStudio.styles.or01_blush', englishLabel: 'OR01 Orange', type: 'color', value: '#F0A88A' },
                    { id: 'peach_puff', labelKey: 'beautyStudio.styles.peach_puff', englishLabel: 'Peach Puff', type: 'color', value: '#FFDAB9' },
                    { id: 'rose_pink', labelKey: 'beautyStudio.styles.rose_pink', englishLabel: 'Rose Pink', type: 'color', value: '#E7ACCF' },
                ]
            },
            {
                id: 'eyebrows', labelKey: 'beautyStudio.subfeatures.eyebrows', englishLabel: 'Eyebrows',
                promptInstruction: "Reshape the eyebrows to a '{{style}}' style.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'natural_arch', labelKey: 'beautyStudio.styles.natural_arch', englishLabel: 'Natural Arch', type: 'image', value: genericIconUrl },
                    { id: 'straight', labelKey: 'beautyStudio.styles.straight', englishLabel: 'Straight', type: 'image', value: genericIconUrl },
                    { id: 'full_natural', labelKey: 'beautyStudio.styles.full_natural', englishLabel: 'Full & Natural', type: 'image', value: genericIconUrl },
                    { id: 'bold', labelKey: 'beautyStudio.styles.bold', englishLabel: 'Bold', type: 'image', value: genericIconUrl },
                ]
            },
            {
                id: 'eyelashes', labelKey: 'beautyStudio.subfeatures.eyelashes', englishLabel: 'Eyelashes',
                promptInstruction: "Apply '{{style}}' style false eyelashes.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'daily_natural', labelKey: 'beautyStudio.styles.daily_natural', englishLabel: 'Daily Natural', type: 'image', value: genericIconUrl },
                    { id: 'barbie_doll', labelKey: 'beautyStudio.styles.barbie_doll', englishLabel: 'Barbie Doll', type: 'image', value: genericIconUrl },
                    { id: 'wispy', labelKey: 'beautyStudio.styles.wispy', englishLabel: 'Wispy', type: 'image', value: genericIconUrl },
                    { id: 'manga', labelKey: 'beautyStudio.styles.manga', englishLabel: 'Manga', type: 'image', value: genericIconUrl },
                ]
            },
            {
                id: 'freckles', labelKey: 'beautyStudio.subfeatures.freckles', englishLabel: 'Freckles',
                promptInstruction: "Add '{{style}}' style freckles to the face.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'lightly_dotted', labelKey: 'beautyStudio.styles.lightly_dotted', englishLabel: 'Lightly Dotted', type: 'image', value: genericIconUrl },
                    { id: 'under_eye', labelKey: 'beautyStudio.styles.under_eye', englishLabel: 'Under Eye', type: 'image', value: genericIconUrl },
                    { id: 'across_nose_cheeks', labelKey: 'beautyStudio.styles.across_nose_cheeks', englishLabel: 'Across Nose and Cheeks', type: 'image', value: genericIconUrl },
                ]
            },
            {
                id: 'contact_lenses', labelKey: 'beautyStudio.subfeatures.contact_lenses', englishLabel: 'Contact Lenses',
                promptInstruction: "Change the eye color and style to look like '{{style}}' contact lenses.",
                styles: [
                    { id: 'none', labelKey: 'beautyStudio.styles.none', englishLabel: 'None', type: 'image', value: genericIconUrl },
                    { id: 'aura', labelKey: 'beautyStudio.styles.aura', englishLabel: 'Aura', type: 'image', value: genericIconUrl },
                    { id: 'yellow', labelKey: 'beautyStudio.styles.yellow', englishLabel: 'Yellow', type: 'image', value: genericIconUrl },
                    { id: 'bright_eyes', labelKey: 'beautyStudio.styles.bright_eyes', englishLabel: 'Bright Eyes', type: 'image', value: genericIconUrl },
                    { id: 'ash_gray', labelKey: 'beautyStudio.styles.ash_gray', englishLabel: 'Ash Gray', type: 'image', value: genericIconUrl },
                ]
            },
        ]
    },
];