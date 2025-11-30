
export default {
    "voiceStudio": {
        "title": "Studio Giọng Nói AI",
        "subtitle": "Chuyển văn bản thành giọng đọc chuyên nghiệp",
        "settings": {
            "voice": "Chọn Giọng Đọc",
            "info": "Thông tin",
            "speed": "Tốc độ đọc",
            "speed_slow": "Chậm",
            "speed_normal": "Vừa",
            "speed_fast": "Nhanh"
        },
        "voices": {
            // NORTH
            "north": {
                "hanoi_female_26": "Nữ Hà Nội - Nhẹ nhàng, Có học thức",
                "hanoi_male_news": "Nam Hà Nội - Tin tức, Đĩnh đạc",
                "haiphong_male": "Nam Hải Phòng - Mạnh mẽ, Phóng khoáng",
                "bacninh_female": "Nữ Bắc Ninh - Quan họ, Ngọt ngào",
                "thaibinh_female_story": "Nữ Thái Bình - Kể chuyện, Mộc mạc",
                "namdinh_male_pod": "Nam Nam Định - Podcast, Rõ ràng",
                "quangninh_male": "Nam Quảng Ninh - Hào sảng, Vui tươi",
                "haiduong_female": "Nữ Hải Dương - Bình dị, Dễ nghe"
            },
            // CENTRAL
            "central": {
                "hue_female": "Nữ Huế - Ngọt ngào, Sâu lắng",
                "nghean_male_story": "Nam Nghệ An - Đọc truyện đêm khuya",
                "danang_male": "Nam Đà Nẵng - Sôi nổi, Thân thiện",
                "hatinh_female": "Nữ Hà Tĩnh - Chân thành, Nặng tình",
                "quangbinh_male": "Nam Quảng Bình - Rắn rỏi, Vang",
                "binhdinh_female": "Nữ Bình Định - Dứt khoát, Nhanh nhẹn",
                "quangtri_male": "Nam Quảng Trị - Thật thà, Đậm đà"
            },
            // SOUTH
            "south": {
                "saigon_female_chic": "Nữ Sài Gòn - Sang chảnh, Dễ thương",
                "saigon_male_vlog": "Nam Sài Gòn - Vlog, Phóng khoáng",
                "cantho_female": "Nữ Cần Thơ - Ngọt ngào, Êm ái",
                "camau_male": "Nam Cà Mau - Hào sảng đất mũi",
                "vinhlong_female_story": "Nữ Vĩnh Long - Kể chuyện xưa",
                "bentre_male": "Nam Bến Tre - Hiền lành, Đều đều",
                "dongthap_female": "Nữ Đồng Tháp - Hương sen, Thanh thoát",
                "vungtau_male": "Nam Vũng Tàu - Hiện đại, Tự nhiên"
            },
            // SPECIAL (NEW)
            "special": {
                "ad_male_promo": "Nam MC Quảng cáo - Năng lượng cao",
                "ad_female_sales": "Nữ Sales Livestream - Nhanh nhảu",
                "story_male_old": "Ông già kể chuyện - Trầm, Khàn",
                "kid_boy": "Bé trai 6 tuổi - Ngây thơ",
                "kid_girl": "Bé gái 5 tuổi - Điệu đà"
            },
            // INTL
            "intl": {
                "us_male": "Tiếng Anh (Mỹ) - Nam Tin Tức",
                "us_female": "Tiếng Anh (Mỹ) - Nữ Nhẹ Nhàng",
                "uk_male": "Tiếng Anh (Anh) - Nam Quý Tộc",
                "uk_female": "Tiếng Anh (Anh) - Nữ Quý Tộc"
            }
        },
        "provinces": {
            "hanoi": "Hà Nội",
            "haiphong": "Hải Phòng",
            "bacninh": "Bắc Ninh",
            "thaibinh": "Thái Bình",
            "namdinh": "Nam Định",
            "quangninh": "Quảng Ninh",
            "haiduong": "Hải Dương",
            "hue": "Huế",
            "danang": "Đà Nẵng",
            "nghean": "Nghệ An",
            "hatinh": "Hà Tĩnh",
            "quangbinh": "Quảng Bình",
            "binhdinh": "Bình Định",
            "quangtri": "Quảng Trị",
            "saigon": "Sài Gòn",
            "cantho": "Cần Thơ",
            "camau": "Cà Mau",
            "vinhlong": "Vĩnh Long",
            "bentre": "Bến Tre",
            "dongthap": "Đồng Tháp",
            "vungtau": "Vũng Tàu",
            "promo": "Quảng Cáo / Sales",
            "kid": "Trẻ Em",
            "us": "Mỹ",
            "uk": "Anh"
        },
        "regions": {
            "north": "Miền Bắc",
            "south": "Miền Nam",
            "central": "Miền Trung",
            "special": "Đặc Biệt",
            "intl": "Quốc tế"
        },
        "input": {
            "label": "Nhập văn bản của bạn",
            "placeholder": "Nhập nội dung bạn muốn chuyển thành giọng nói tại đây (Tối đa 5000 ký tự)..."
        },
        "output": {
            "placeholder": "Sóng âm thanh sẽ xuất hiện ở đây sau khi tạo."
        },
        "actions": {
            "generate": "Tạo Giọng Nói",
            "generating": "Đang xử lý...",
            "play": "Phát",
            "pause": "Tạm dừng"
        },
        "infoText": "Hệ thống sử dụng kỹ thuật 'Prompt Engineering' tiên tiến để mô phỏng giọng nói vùng miền. Bằng cách mô tả chi tiết độ tuổi, tính cách và chất giọng (ví dụ: Nữ Hà Nội 26 tuổi, Nam Nghệ An chất phác), AI sẽ điều chỉnh ngữ điệu và phát âm để tạo ra kết quả chân thực nhất. Lưu ý: Giọng kể chuyện (Thái Bình, Nghệ An, Vĩnh Long) sẽ có nhịp độ chậm hơn để phù hợp với cảm xúc."
    }
}
