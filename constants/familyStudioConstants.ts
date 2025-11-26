
import type { FamilyStudioSettings, FamilyMember } from '../types';

export const FAMILY_ASPECT_RATIOS: { value: '4:3' | '16:9', labelKey: string }[] = [
    { value: '4:3', labelKey: 'familyStudio.aspectRatios.horizontal' },
    { value: '16:9', labelKey: 'familyStudio.aspectRatios.wide' },
];

export const FAMILY_SCENES = [
    // --- Studio & Trong nhà ---
    'studio_white', 'studio_gray', 'studio_warm', 'living_room', 'luxury_library', 'cozy_cafe', 'reading_by_fireplace', 'baking_in_kitchen', 'tet_feast_table', 'art_museum', 'art_gallery_opening',
    // --- Ngoài trời & Thiên nhiên ---
    'park_picnic', 'beach_sunset', 'flower_garden', 'mountain_landscape', 'forest_camping', 'clear_stream', 'lavender_field', 'autumn_leaves', 'resort_pool', 'farm_setting', 'golden_rice_field', 'da_lat_pine_forest', 'rooftop_garden', 'on_the_golf_course', 'ski_resort',
    // --- Du lịch Việt Nam ---
    'ancient_town', 'ha_long_bay', 'terraced_fields', 'sapa_town', 'hanoi_old_quarter', 'hoan_kiem_lake', 'trang_an_ninh_binh', 'hue_imperial_city', 'golden_bridge_danang', 'nha_trang_beach', 'dalat_flower_garden', 'mui_ne_sand_dunes', 'mekong_delta', 'ha_giang_loop', 'son_doong_cave', 'my_khe_beach_danang', 'cai_rang_floating_market', 'temple_of_literature', 'hanoi_opera_house', 'ponagar_tower', 'sao_beach_phu_quoc', 'northern_ancient_house',
    // --- Du lịch Quốc tế ---
    'eiffel_tower_paris', 'times_square_nyc', 'great_wall_china', 'pyramids_egypt', 'santorini_greece', 'hollywood_film_set',
    // --- Sự kiện & Lễ hội ---
    'tet_holiday', 'christmas', 'hot_air_balloon', 'sky_lantern_festival', 'amusement_park', 'sports_stadium', 'concert_stage', 'red_carpet_event',
    // --- Sáng tạo & Giả tưởng ---
    'underwater_aquarium', 'on_the_moon', 'fairytale_castle', 'cyberpunk_city', 'wizarding_school_library', 'on_a_cloud', 'dinosaur_park', 'spaceship_interior', 'underwater_city', 'royal_palace', 'steampunk_world'
].sort((a,b) => a.localeCompare(b));

export const FAMILY_OUTFITS = [
    // --- TRANG TRỌNG & CÔNG SỞ ---
    'formal_vest', 'business_suits', 'smart_casual', 'turtleneck_and_blazer', 'smart_trench_coats', 'royal_family_attire', 'old_money_style', 'graduation_gowns',
    // --- THƯỜNG NGÀY & DẠO PHỐ ---
    'casual_jeans', 'denim_leather', 'korean_street_style', 'japanese_minimalist', 'athleisure_wear', 'bohemian_style', 'preppy_style', 'streetwear_style',
    // --- ĐỒNG PHỤC GIA ĐÌNH ---
    'matching_tshirts', 'matching_sweaters', 'matching_pajamas', 'luxury_silk_pajamas',
    // --- THỂ THAO & YÊU NƯỚC ---
    'matching_sportswear', 'vietnam_sportswear', 'patriotic_tshirt_shorts', 'patriotic_polo_khaki',
    // --- TRUYỀN THỐNG & VĂN HÓA ---
    'traditional_ao_dai', 'vietnam_flag_ao_dai', 'vietnamese_ao_ba_ba', 'vietnamese_ao_tu_than', 'traditional_ethnic', 'korean_hanbok', 'japanese_kimono_yukata', 'chinese_hanfu_cheongsam', 'historical_costumes', 'retro_vietnam',
    // --- THEO MÙA & LỄ HỘI ---
    'beachwear', 'winter_coats', 'spring_floral', 'autumn_layers', 'mid_autumn_costumes', 'halloween_costumes',
    // --- GIẢ TƯỞNG & VUI NHỘN ---
    'superhero_family', 'fairytale_costumes', 'wizarding_world', 'pirate_costumes', 'astronaut_costumes', 'cyberpunk_future', 'rock_n_roll_style',
    // --- NGÀNH NGHỀ & HOẠT ĐỘNG ---
    'school_uniform', 'medical_attire', 'pilot_flight_attendant', 'firefighter_uniforms', 'artist_style', 'cooking_together', 'gardening_outfits',
].sort((a,b) => a.localeCompare(b));


export const FAMILY_POSES = [
    'formal_standing',
    'casual_sitting',
    'playful_interaction',
    'walking_together',
    'group_hug',
];

export const DEFAULT_FAMILY_STUDIO_SETTINGS: FamilyStudioSettings = {
    members: [
        { id: `member_${Date.now()}_1`, photo: null, age: '' },
        { id: `member_${Date.now()}_2`, photo: null, age: '' },
    ],
    scene: 'Studio (Nền trắng)',
    outfit: 'Lịch sự (Sơ mi & Váy)',
    pose: 'Đứng trang trọng',
    customPrompt: '',
    aspectRatio: '4:3',
    faceConsistency: true,
    highQuality: false, // Default to false (Standard)
};
