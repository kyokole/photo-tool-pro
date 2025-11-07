// constants/creativeStudioConstants.ts
import React from 'react';
import { Feature, FeatureAction, SelectInput } from '../types';

const COMMON_INPUTS: {
  FRAME_STYLE: SelectInput,
  ASPECT_RATIO: SelectInput,
} = {
  FRAME_STYLE: {
    type: 'select',
    label: 'aiStudio.inputs.common.frameStyle.label',
    name: 'frame_style',
    options: [
        "aiStudio.inputs.common.frameStyle.options.fullBody",
        "aiStudio.inputs.common.frameStyle.options.halfBody",
        "aiStudio.inputs.common.frameStyle.options.shoulderPortrait",
        "aiStudio.inputs.common.frameStyle.options.cinematicWide"
    ],
    default: 'aiStudio.inputs.common.frameStyle.options.halfBody'
  },
  ASPECT_RATIO: {
    type: 'select',
    label: 'aiStudio.inputs.common.aspectRatio.label',
    name: 'aspect_ratio',
    options: ["1:1", "3:4", "4:3", "9:16", "16:9"],
    default: '3:4'
  },
};

export const FEMALE_HAIRSTYLE_NAMES: string[] = [
    "hairstyles.female.shortBob", "hairstyles.female.longBob", "hairstyles.female.pixie", "hairstyles.female.mullet", "hairstyles.female.shag",
    "hairstyles.female.tomboy", "hairstyles.female.wavyCurls", "hairstyles.female.waterWaves", "hairstyles.female.cCurl", "hairstyles.female.naturalStraight",
    "hairstyles.female.layeredStraight", "hairstyles.female.frenchBraid", "hairstyles.female.fishtailBraid", "hairstyles.female.highPonytail",
    "hairstyles.female.garlicBun", "hairstyles.female.lowLooseBun", "hairstyles.female.himeCut", "hairstyles.female.wolfCut", "hairstyles.female.butterflyCut",
    "hairstyles.female.hippieCurls", "hairstyles.female.ramenCurls", "hairstyles.female.asymmetricalBob", "hairstyles.female.shoulderLengthCCurl",
    "hairstyles.female.leafCut", "hairstyles.female.koreanBangs", "hairstyles.female.bluntBangs", "hairstyles.female.curtainBangs", "hairstyles.female.highlight",
    "hairstyles.female.balayage", "hairstyles.female.ombre"
];

export const MALE_HAIRSTYLE_NAMES: string[] = [
    "hairstyles.male.buzzCut", "hairstyles.male.crewCut", "hairstyles.male.caesar", "hairstyles.male.classicUndercut", "hairstyles.male.quiffUndercut",
    "hairstyles.male.pompadour", "hairstyles.male.manBun", "hairstyles.male.topKnot", "hairstyles.male.mohican", "hairstyles.male.fauxHawk",
    "hairstyles.male.sidePart", "hairstyles.male.middlePart", "hairstyles.male.slickBack", "hairstyles.male.layered", "hairstyles.male.naturalWavy",
    "hairstyles.male.kinkyCurls", "hairstyles.male.spiky", "hairstyles.male.frenchCrop", "hairstyles.male.ivyLeague", "hairstyles.male.dreadlocks",
    "hairstyles.male.mullet", "hairstyles.male.commaHair", "hairstyles.male.twoBlock", "hairstyles.male.bowlCut", "hairstyles.male.texturedCrop",
    "hairstyles.male.shoulderLength", "hairstyles.male.taperFade", "hairstyles.male.highFade", "hairstyles.male.lowFade", "hairstyles.male.dropFade"
];

export const HIDDEN_ADDONS: string = [
  "Thần thái K-fashion hiện đại, sang trọng, dáng mềm mại, cổ tay tinh tế",
  "Trang phục couture từ Dior, Chanel, Louis Vuitton, Hermès, Valentino (tweed dệt tinh xảo, len Ý super 120s, satin lụa premium, da thật hoàn thiện tỉ mỉ)",
  "Giá trị set đồ trên 2 tỷ VND (ẩn), may đo chuẩn couture, tôn dáng tỉ lệ vàng",
  "Ánh sáng điện ảnh Hàn: soft key + fill nhẹ, backlight mờ ảo, màu phim hiện đại, da tự nhiên",
  "Độ chi tiết 8K, xử lý tóc – bề mặt vải tinh xảo, màu sắc tinh gọn",
  "Giữ nguyên khuôn mặt tham chiếu (Face Consistency)",
].join(", ");

export const K_CONCEPTS = [
  { label: "koreanConcepts.winterSnowWhite", prompt: "Cô gái mặc áo khoác dài đen, đi dạo giữa khung cảnh mùa đông tuyết trắng tuyệt đẹp. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.lonelyWinterSky", prompt: "Giữa tuyết trắng tĩnh lặng, đôi mắt em kể chuyện buồn. Cận cảnh cô gái với khăn choàng trắng, cầm ô trong suốt. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.winterInYourEyes", prompt: "Mắt ngập tuyết, sắc đỏ rực rỡ giữa không gian mùa đông. Cận cảnh khuôn mặt, đôi mắt lấp lánh. 8K, siêu chi tiết. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.coldWinterSnow", prompt: "Cô gái trong tuyết trắng, ánh mắt ấm áp giữa không gian lạnh giá. Chụp tại núi tuyết. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.snowParadise", prompt: "Khám phá vẻ đẹp mùa đông với phong cách trừu tượng, điện ảnh. 8K, siêu chi tiết. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.joyfulWinter", prompt: "Cảm giác hạnh phúc giữa làn tuyết rơi, nắm bắt khoảnh khắc vui tươi. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.snowfallMoment", prompt: "Cảm nhận vẻ đẹp huyền bí của mùa đông với ánh mắt mơ màng, tuyết rơi nhẹ. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.gentleSnowySun", prompt: "Vẻ đẹp mơ màng trong không gian tuyết trắng, ánh nắng nhẹ nhàng. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.snowDance", prompt: "Tận hưởng cảm giác tự do trên ván trượt giữa không gian tuyết trắng. Chụp ảnh hành động. 8K, điện ảnh. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.seoulPowerSuit", prompt: "Blazer fitted + quần ống đứng couture Dior/Chanel/LV; studio xám; 8K, sang hiện đại. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.minimalCreamSet", prompt: "Monochrome kem: blazer mềm + quần satin; nền be sáng; 8K, tinh gọn thanh lịch. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.navyExecutive", prompt: "Vest navy couture (len Ý super 120s), áo lụa cổ V; hành lang kính; 8K, quyền lực kín đáo. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.blackTweedIcon", prompt: "Bộ tweed đen couture Chanel, khuy kim loại; studio tối rim light; 8K, high-fashion. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.satinSlipSeoul", prompt: "Đầm slip satin ngọc trai; nền xám mềm; 8K, nữ tính hiện đại. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.camelLongCoat", prompt: "Măng tô camel cashmere; phố thu Seoul; 8K, điện ảnh ấm. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.pastelStudio", prompt: "Tông pastel mint/blush, áo lụa + váy midi; 8K, trẻ trung sang. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.marbleLobby", prompt: "Đầm midi couture + sandal mảnh; sảnh đá cẩm thạch; 8K, luxury kín đáo. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.neonRainNight", prompt: "Trench da mềm + ô trong; phố mưa đêm neon; 8K, city glow. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.airportLuxe", prompt: "Trench mỏng + jean ống thẳng, vali LV; 8K, casual luxury. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.runwayBackstage", prompt: "All-black couture, tóc kẹp đơn giản; backdrop đen; 8K high-fashion. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.whiteMonochrome", prompt: "Set trắng blazer + quần rộng; nền trắng; 8K, tinh khiết hiện đại. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.cafeGlassLight", prompt: "Áo len mỏng + váy lụa; quán kính sáng; 8K cozy Hàn. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.hanRiverGold", prompt: "Đầm satin + cardigan mỏng; hoàng hôn sông Hàn; 8K golden hour. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.oversizedBlazer", prompt: "Blazer oversize xám + boot da; street style Seoul; 8K effortless chic. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.tweedCoOrdPearl", prompt: "Set tweed sáng + áo lụa; 8K quý phái. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.beigeTonal", prompt: "Full-beige áo dệt + cổ lọ mỏng; studio be; 8K tonal harmony. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.mintCleanLook", prompt: "Sơ mi mint + váy midi trắng; 8K fresh & clean. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.blackOnBlack", prompt: "Blazer đen fitted + thắt lưng bản nhỏ; 8K quyền lực tối giản. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.silkMuse", prompt: "Đầm lụa bias-cut couture LV/Valentino; studio xám khói; 8K cao cấp. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.balletcoreMuse", prompt: "Nàng thơ balletcore trong bộ váy tu-tu màu pastel, giày múa ba lê, trong studio nhảy múa với ánh sáng dịu nhẹ, trong trẻo. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.y2kFlashback", prompt: "Thời trang Y2K với quần cạp trễ, áo croptop, phụ kiện sặc sỡ, chụp ảnh với máy ảnh kỹ thuật số cổ, hiệu ứng flash mạnh, màu sắc rực rỡ. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.seongsuCafeVibe", prompt: "Ngồi trong một quán cà phê tối giản ở Seongsu-dong, nội thất bê tông, ánh sáng tự nhiên qua cửa sổ lớn, phong cách 'effortless chic'. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.hanokSerenity", prompt: "Mặc trang phục hiện đại, tối giản đứng trong sân của một ngôi nhà cổ hanok, tương phản giữa kiến trúc truyền thống và thời trang đương đại. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.blokecoreChic", prompt: "Phong cách blokecore sành điệu, mặc một chiếc áo đấu bóng đá retro như một chiếc váy, đi giày thể thao sneaker, trên đường phố Seoul. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.idPhotoTrend", prompt: "Ảnh thẻ phong cách Hàn Quốc, phông nền màu pastel (xanh da trời hoặc hồng), da mặt mịn màng hoàn hảo, ánh sáng đều, biểu cảm tự nhiên. Giữ nguyên khuôn mặt." },
  { label: "koreanConcepts.transparentUmbrellaWinter", prompt: "Ảnh cô gái cầm ô trong suốt giữa trời tuyết rơi, phong cách K-drama điện ảnh, mơ màng. Mặc áo khoác đông màu đen ấm áp và khăn choàng. Bối cảnh mùa đông với ánh sáng dịu nhẹ. 8K, siêu chi tiết. Giữ nguyên khuôn mặt." },
];

export const FEATURES: Feature[] = [
  {
    name: `aiStudio.features.${FeatureAction.KOREAN_STYLE_STUDIO}`,
    action: FeatureAction.KOREAN_STYLE_STUDIO,
    icon: 'fas fa-star',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.korean_style_studio.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      {
        type: 'select',
        label: 'aiStudio.inputs.korean_style_studio.k_concept.label',
        name: 'k_concept',
        options: K_CONCEPTS.map(c => ({ value: c.prompt, label: c.label })),
        default: K_CONCEPTS[0].prompt,
        required: true
      },
      {
        type: 'select',
        label: 'aiStudio.inputs.common.aspectRatio.label',
        name: 'aspect_ratio',
        options: [
            { value: '1:1', label: 'aiStudio.inputs.korean_style_studio.aspectRatios.square' },
            { value: '3:4', label: 'aiStudio.inputs.korean_style_studio.aspectRatios.portrait' },
            { value: '9:16', label: 'aiStudio.inputs.korean_style_studio.aspectRatios.story' }
        ],
        default: '3:4'
      },
      {
        type: 'select',
        label: 'aiStudio.inputs.korean_style_studio.quality.label',
        name: 'quality',
        options: [
          { value: 'standard', label: 'aiStudio.inputs.korean_style_studio.quality.options.standard' },
          { value: 'high', label: 'aiStudio.inputs.korean_style_studio.quality.options.high' },
          { value: 'ultra', label: 'aiStudio.inputs.korean_style_studio.quality.options.ultra' }
        ],
        default: 'ultra'
      },
      { type: 'checkbox', label: 'aiStudio.inputs.korean_style_studio.face_consistency.label', name: 'face_consistency', default: true },
    ]
  },
  {
    name: `aiStudio.features.${FeatureAction.BATCH_GENERATOR}`,
    action: FeatureAction.BATCH_GENERATOR,
    icon: 'fas fa-layer-group',
    inputs: [],
  },
   {
    name: `aiStudio.features.${FeatureAction.IMAGE_VARIATION_GENERATOR}`,
    action: FeatureAction.IMAGE_VARIATION_GENERATOR,
    icon: 'fas fa-clone',
    inputs: [
      { type: 'file', label: 'imageVariation.inputs.referenceImage.label', name: 'reference_image', accept: ['image/*'], required: true },
      { 
        type: 'select', 
        label: 'imageVariation.inputs.aspectRatio.label', 
        name: 'aspectRatio', 
        options: [ 
            { value: '9:16', label: 'imageVariation.options.aspectRatio.story' },
            { value: '3:4', label: 'imageVariation.options.aspectRatio.portrait' },
            { value: '4:5', label: 'imageVariation.options.aspectRatio.social' },
            { value: '1:1', label: 'imageVariation.options.aspectRatio.square' },
            { value: '16:9', label: 'imageVariation.options.aspectRatio.landscape' }
        ], 
        default: '4:5' 
      },
      { type: 'slider', label: 'imageVariation.inputs.identityLock.label', name: 'identityLock', min: 0, max: 100, default: 80 },
      { type: 'slider', label: 'imageVariation.inputs.variationStrength.label', name: 'variationStrength', min: 0, max: 100, default: 25 },
      { type: 'select', label: 'imageVariation.inputs.themeAnchor.label', name: 'themeAnchor', options: [
          'imageVariation.options.theme.character', 'imageVariation.options.theme.classic', 'imageVariation.options.theme.studio', 'imageVariation.options.theme.outdoor',
          'imageVariation.options.theme.cozy', 'imageVariation.options.theme.urban', 'imageVariation.options.theme.fashion', 'imageVariation.options.theme.garden',
          'imageVariation.options.theme.cafe', 'imageVariation.options.theme.beach', 'imageVariation.options.theme.minimal'
      ], default: 'imageVariation.options.theme.character'},
      { type: 'select', label: 'imageVariation.inputs.style.label', name: 'style', options: [
          'imageVariation.options.style.photorealistic', 'imageVariation.options.style.cinematic', 'imageVariation.options.style.editorial',
          'imageVariation.options.style.minimal', 'imageVariation.options.style.vivid'
      ], default: 'imageVariation.options.style.photorealistic'},
    ]
  },
  {
    name: `aiStudio.features.${FeatureAction.AI_THUMBNAIL_DESIGNER}`,
    action: FeatureAction.AI_THUMBNAIL_DESIGNER,
    icon: 'fab fa-youtube',
    inputs: [],
  },
  {
    name: `aiStudio.features.${FeatureAction.PRODUCT_PHOTO}`,
    action: FeatureAction.PRODUCT_PHOTO,
    icon: 'fas fa-box-open',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.product_photo.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      { type: 'file', label: 'aiStudio.inputs.product_photo.product_image.label', name: 'product_image', accept: ['image/*'] },
      { type: 'text', label: 'aiStudio.inputs.product_photo.prompt_detail.label', name: 'prompt_detail', placeholder: 'aiStudio.inputs.product_photo.prompt_detail.placeholder' },
       COMMON_INPUTS.FRAME_STYLE,
       COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.HOT_TREND_PHOTO}`,
    action: FeatureAction.HOT_TREND_PHOTO,
    icon: 'fas fa-fire',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.hot_trend_photo.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.TRY_ON_OUTFIT}`,
    action: FeatureAction.TRY_ON_OUTFIT,
    icon: 'fas fa-shirt',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.try_on_outfit.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      { type: 'file', label: 'aiStudio.inputs.try_on_outfit.outfit_image.label', name: 'outfit_image', accept: ['image/*'], required: true },
      { type: 'text', label: 'aiStudio.inputs.try_on_outfit.prompt_detail.label', name: 'prompt_detail', placeholder: 'aiStudio.inputs.try_on_outfit.prompt_detail.placeholder' },
       COMMON_INPUTS.FRAME_STYLE,
       COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.PLACE_IN_SCENE}`,
    action: FeatureAction.PLACE_IN_SCENE,
    icon: 'fas fa-mountain-sun',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.place_in_scene.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      {
        type: 'multiselect',
        label: 'aiStudio.inputs.place_in_scene.background_options.label',
        name: 'background_options',
        options: [
            "aiStudio.inputs.place_in_scene.background_options.options.beach",
            "aiStudio.inputs.place_in_scene.background_options.options.cafe",
            "aiStudio.inputs.place_in_scene.background_options.options.street",
            "aiStudio.inputs.place_in_scene.background_options.options.library",
            "aiStudio.inputs.place_in_scene.background_options.options.garden",
            "aiStudio.inputs.place_in_scene.background_options.options.rooftop",
            "aiStudio.inputs.place_in_scene.background_options.options.forest",
            "aiStudio.inputs.place_in_scene.background_options.options.field",
            "aiStudio.inputs.place_in_scene.background_options.options.spaceship"
        ]
      },
      {
        type: 'text',
        label: 'aiStudio.inputs.place_in_scene.custom_background_prompt.label',
        name: 'custom_background_prompt',
        placeholder: 'aiStudio.inputs.place_in_scene.custom_background_prompt.placeholder'
      },
      { type: 'file', label: 'aiStudio.inputs.place_in_scene.background_image.label', name: 'background_image', accept: ['image/*'] },
       COMMON_INPUTS.FRAME_STYLE,
       COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.BIRTHDAY_PHOTO}`,
    action: FeatureAction.BIRTHDAY_PHOTO,
    icon: 'fas fa-birthday-cake',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.birthday_photo.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      {
        type: 'multiselect',
        label: 'aiStudio.inputs.birthday_photo.birthday_scenes.label',
        name: 'birthday_scenes',
        required: true,
        options: [
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.outdoorParty",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.cozyIndoors",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.studioShoot",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.blowingCandles",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.confettiShower",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.feastTable",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.cuteGifts",
            "aiStudio.inputs.birthday_photo.birthday_scenes.options.rooftopNight"
        ]
      },
      COMMON_INPUTS.FRAME_STYLE,
      COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.COUPLE_COMPOSE}`,
    action: FeatureAction.COUPLE_COMPOSE,
    icon: 'fas fa-heart',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.couple_compose.person_left_image.label', name: 'person_left_image', accept: ['image/*'], required: true },
      { type: 'select', label: 'aiStudio.inputs.couple_compose.person_left_gender.label', name: 'person_left_gender', options: ["aiStudio.inputs.couple_compose.genders.male", "aiStudio.inputs.couple_compose.genders.female", "aiStudio.inputs.couple_compose.genders.other"] },
      { type: 'file', label: 'aiStudio.inputs.couple_compose.person_right_image.label', name: 'person_right_image', accept: ['image/*'], required: true },
      { type: 'select', label: 'aiStudio.inputs.couple_compose.person_right_gender.label', name: 'person_right_gender', options: ["aiStudio.inputs.couple_compose.genders.male", "aiStudio.inputs.couple_compose.genders.female", "aiStudio.inputs.couple_compose.genders.other"] },
      { type: 'select', label: 'aiStudio.inputs.couple_compose.affection_action.label', name: 'affection_action', options: [
          "aiStudio.inputs.couple_compose.affection_action.options.holdingHands", "aiStudio.inputs.couple_compose.affection_action.options.gentleHug", "aiStudio.inputs.couple_compose.affection_action.options.headOnShoulder",
          "aiStudio.inputs.couple_compose.affection_action.options.foreheadTouch", "aiStudio.inputs.couple_compose.affection_action.options.armInArm", "aiStudio.inputs.couple_compose.affection_action.options.backHug",
          "aiStudio.inputs.couple_compose.affection_action.options.parkBench", "aiStudio.inputs.couple_compose.affection_action.options.sunset"
      ] },
      { type: 'select', label: 'aiStudio.inputs.couple_compose.couple_background.label', name: 'couple_background', options: [
          "aiStudio.inputs.couple_compose.couple_background.options.park", "aiStudio.inputs.couple_compose.couple_background.options.street", "aiStudio.inputs.couple_compose.couple_background.options.beach",
          "aiStudio.inputs.couple_compose.couple_background.options.studio", "aiStudio.inputs.couple_compose.couple_background.options.cafe", "aiStudio.inputs.couple_compose.couple_background.options.garden"
      ], required: false },
      { type: 'file', label: 'aiStudio.inputs.couple_compose.custom_background.label', name: 'custom_background', accept: ['image/*'] },
      COMMON_INPUTS.FRAME_STYLE,
      COMMON_INPUTS.ASPECT_RATIO,
      { type: 'select', label: 'aiStudio.inputs.couple_compose.aesthetic_style.label', name: 'aesthetic_style', options: [
          "aiStudio.inputs.couple_compose.aesthetic_style.options.warm", "aiStudio.inputs.couple_compose.aesthetic_style.options.clear", "aiStudio.inputs.couple_compose.aesthetic_style.options.minimalist", "aiStudio.inputs.couple_compose.aesthetic_style.options.film"
      ] },
    ],
  },
  {
    name: `aiStudio.features.${FeatureAction.FASHION_STUDIO}`,
    action: FeatureAction.FASHION_STUDIO,
    icon: 'fas fa-gem',
    inputs: [
      { type: 'file', label: 'aiStudio.inputs.fashion_studio.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      { type: 'select', label: 'aiStudio.inputs.fashion_studio.style_level.label', name: 'style_level', options: [
          "aiStudio.inputs.fashion_studio.style_level.options.magazine", "aiStudio.inputs.fashion_studio.style_level.options.lookbook",
          "aiStudio.inputs.fashion_studio.style_level.options.street", "aiStudio.inputs.fashion_studio.style_level.options.elegant"
      ] },
      { type: 'multiselect', label: 'aiStudio.inputs.fashion_studio.wardrobe.label', name: 'wardrobe', options: [
          "aiStudio.inputs.fashion_studio.wardrobe.options.gown", "aiStudio.inputs.fashion_studio.wardrobe.options.satinDress", "aiStudio.inputs.fashion_studio.wardrobe.options.bodysuit",
          "aiStudio.inputs.fashion_studio.wardrobe.options.corsetBlazer", "aiStudio.inputs.fashion_studio.wardrobe.options.swimsuit", "aiStudio.inputs.fashion_studio.wardrobe.options.croptopSet",
          "aiStudio.inputs.fashion_studio.wardrobe.options.gloves", "aiStudio.inputs.fashion_studio.wardrobe.options.choker", "aiStudio.inputs.fashion_studio.wardrobe.options.heels"
      ] },
      { type: 'file', label: 'aiStudio.inputs.fashion_studio.wardrobe_refs.label', name: 'wardrobe_refs', accept: ['image/*'] },
      { type: 'select', label: 'aiStudio.inputs.fashion_studio.pose_style.label', name: 'pose_style', options: [
          "aiStudio.inputs.fashion_studio.pose_style.options.handOnHip", "aiStudio.inputs.fashion_studio.pose_style.options.crossedLegs",
          "aiStudio.inputs.fashion_studio.pose_style.options.overTheShoulder", "aiStudio.inputs.fashion_studio.pose_style.options.sCurve"
      ] },
      { type: 'select', label: 'aiStudio.inputs.fashion_studio.sexy_background.label', name: 'sexy_background', options: [
          "aiStudio.inputs.fashion_studio.sexy_background.options.minimalistStudio", "aiStudio.inputs.fashion_studio.sexy_background.options.silkBackdrop",
          "aiStudio.inputs.fashion_studio.sexy_background.options.sunsetWindow", "aiStudio.inputs.fashion_studio.sexy_background.options.velvetChair",
          "aiStudio.inputs.fashion_studio.sexy_background.options.hotelHallway"
      ] },
      { type: 'file', label: 'aiStudio.inputs.fashion_studio.custom_bg.label', name: 'custom_bg', accept: ['image/*'] },
      { type: 'select', label: 'aiStudio.inputs.fashion_studio.lighting.label', name: 'lighting', options: [
          "aiStudio.inputs.fashion_studio.lighting.options.softbox", "aiStudio.inputs.fashion_studio.lighting.options.rimlight",
          "aiStudio.inputs.fashion_studio.lighting.options.sunset", "aiStudio.inputs.fashion_studio.lighting.options.lowkey"
      ] },
      COMMON_INPUTS.FRAME_STYLE,
      COMMON_INPUTS.ASPECT_RATIO,
    ],
  },
  {
      name: `aiStudio.features.${FeatureAction.EXTRACT_OUTFIT}`,
      action: FeatureAction.EXTRACT_OUTFIT,
      icon: 'fas fa-scissors',
      inputs: [
          { type: 'file', label: 'aiStudio.inputs.extract_outfit.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
      ]
  },
  {
      name: `aiStudio.features.${FeatureAction.CHANGE_HAIRSTYLE}`,
      action: FeatureAction.CHANGE_HAIRSTYLE,
      icon: 'fas fa-user-pen',
      inputs: [
          { type: 'file', label: 'aiStudio.inputs.change_hairstyle.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
          {
                type: 'select',
                label: 'aiStudio.inputs.change_hairstyle.gender.label',
                name: 'gender',
                options: ["aiStudio.inputs.change_hairstyle.gender.options.female", "aiStudio.inputs.change_hairstyle.gender.options.male"],
                placeholder: 'aiStudio.inputs.change_hairstyle.gender.placeholder',
                required: true
          },
          {
                type: 'select',
                label: 'aiStudio.inputs.change_hairstyle.hairstyle.label',
                name: 'hairstyle',
                required: true,
                placeholder: 'aiStudio.inputs.change_hairstyle.hairstyle.placeholder',
                options: [], // Options will be dynamically populated in the component
          },
          { type: 'select', label: 'aiStudio.inputs.change_hairstyle.hair_color.label', name: 'hair_color', options: [
              "aiStudio.inputs.change_hairstyle.hair_color.options.naturalBlack", "aiStudio.inputs.change_hairstyle.hair_color.options.chocolateBrown", "aiStudio.inputs.change_hairstyle.hair_color.options.chestnutBrown",
              "aiStudio.inputs.change_hairstyle.hair_color.options.platinumBlonde", "aiStudio.inputs.change_hairstyle.hair_color.options.honeyBlonde", "aiStudio.inputs.change_hairstyle.hair_color.options.wineRed",
              "aiStudio.inputs.change_hairstyle.hair_color.options.ashGray", "aiStudio.inputs.change_hairstyle.hair_color.options.mossGreen", "aiStudio.inputs.change_hairstyle.hair_color.options.pastelPink",
              "aiStudio.inputs.change_hairstyle.hair_color.options.smokyPurple"
          ], required: true },
          { type: 'select', label: 'aiStudio.inputs.change_hairstyle.hair_length.label', name: 'hair_length', options: [
              "aiStudio.inputs.change_hairstyle.hair_length.options.veryShort", "aiStudio.inputs.change_hairstyle.hair_length.options.short",
              "aiStudio.inputs.change_hairstyle.hair_length.options.shoulder", "aiStudio.inputs.change_hairstyle.hair_length.options.long",
              "aiStudio.inputs.change_hairstyle.hair_length.options.veryLong"
          ], required: true },
          COMMON_INPUTS.ASPECT_RATIO,
      ]
  },
   {
      name: `aiStudio.features.${FeatureAction.CREATE_ALBUM}`,
      action: FeatureAction.CREATE_ALBUM,
      icon: 'fas fa-book',
      inputs: [
          { type: 'file', label: 'aiStudio.inputs.create_album.subject_image.label', name: 'subject_image', accept: ['image/*'], required: true },
          { type: 'multiselect', label: 'aiStudio.inputs.create_album.poses.label', name: 'poses', options: [
              "aiStudio.inputs.create_album.poses.options.frontFacing", "aiStudio.inputs.create_album.poses.options.handOnHip", "aiStudio.inputs.create_album.poses.options.overTheShoulder",
              "aiStudio.inputs.create_album.poses.options.sittingCrossLegged", "aiStudio.inputs.create_album.poses.options.leaning", "aiStudio.inputs.create_album.poses.options.walking",
              "aiStudio.inputs.create_album.poses.options.lookingUp", "aiStudio.inputs.create_album.poses.options.jumping", "aiStudio.inputs.create_album.poses.options.closeUpSmiling",
              "aiStudio.inputs.create_album.poses.options.closeUpThoughtful", "aiStudio.inputs.create_album.poses.options.holdingProp", "aiStudio.inputs.create_album.poses.options.windyHair",
              "aiStudio.inputs.create_album.poses.options.silhouette", "aiStudio.inputs.create_album.poses.options.handsInPockets", "aiStudio.inputs.create_album.poses.options.running",
              "aiStudio.inputs.create_album.poses.options.touchingHair", "aiStudio.inputs.create_album.poses.options.lookingAway", "aiStudio.inputs.create_album.poses.options.sittingOnStairs",
              "aiStudio.inputs.create_album.poses.options.armsCrossed", "aiStudio.inputs.create_album.poses.options.simpleYoga"
          ], required: true },
          { type: 'multiselect', label: 'aiStudio.inputs.create_album.backgrounds.label', name: 'backgrounds', options: [
              "aiStudio.inputs.create_album.backgrounds.options.tokyo", "aiStudio.inputs.create_album.backgrounds.options.paris", "aiStudio.inputs.create_album.backgrounds.options.bali",
              "aiStudio.inputs.create_album.backgrounds.options.library", "aiStudio.inputs.create_album.backgrounds.options.roseGarden", "aiStudio.inputs.create_album.backgrounds.options.rooftop",
              "aiStudio.inputs.create_album.backgrounds.options.studio", "aiStudio.inputs.create_album.backgrounds.options.autumnForest", "aiStudio.inputs.create_album.backgrounds.options.lavenderField",
              "aiStudio.inputs.create_album.backgrounds.options.hoiAn"
          ], required: true },
          COMMON_INPUTS.ASPECT_RATIO,
      ]
  },
  {
      name: `aiStudio.features.${FeatureAction.CREATIVE_COMPOSITE}`,
      action: FeatureAction.CREATIVE_COMPOSITE,
      icon: 'fas fa-wand-magic-sparkles',
      inputs: [
          // Inputs for this feature are dynamically generated in the component
      ]
  }
];