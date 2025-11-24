
export default {
    "batch": {
        // --- Keys for Creative Studio Batch Processor (and shared keys) ---
        "title": "Xử lý Ảnh thẻ Hàng loạt", // Ghi đè cho Ảnh thẻ
        "subtitle": "Xếp hàng đợi {{count}} ảnh để xử lý với cùng một cài đặt.", // Ghi đè cho Ảnh thẻ

        "addQueue": "1. Thêm tác vụ vào hàng đợi",
        "results": "2. Kết quả & Tiến trình",
        "promptLabel": "Nội dung mô tả",
        "promptPlaceholder": "ví dụ: Một bức ảnh chân thực về một chú mèo phi hành gia trên sao Hỏa",
        "aspectRatioLabel": "Tỷ lệ khung hình",
        "numImagesLabel": "Số lượng ảnh",
        "inputType": "Loại đầu vào: Tạo ảnh từ văn bản",
        "addToQueue": "Thêm vào hàng đợi",
        "or": "Hoặc",
        "uploadFile": "Tải lên tệp (TXT/CSV/JSON)",
        "txtFormat": "Định dạng TXT: Một nội dung mô tả trên mỗi dòng.",
        "csvFormat": "Định dạng CSV: prompt,aspectRatio,numOutputs (có tiêu đề)",
        "jsonFormat": "Tệp JSON: Mảng các đối tượng {'prompt': '...', ...}",
        "pendingTasks": "Tác vụ đang chờ ({{count}}/50)",
        "concurrentTasks": "Số tác vụ đồng thời (tối đa 10)",
        "startProcessing": "Bắt đầu xử lý ({{count}}) tác vụ",
        "noTasks": "Chưa có tác vụ nào được gửi.",
        "noTasksDesc": "Thêm tác vụ và nhấp vào \"Bắt đầu xử lý\" để bắt đầu.",
        "downloadAll": "Tải xuống tất cả",
        "clearAll": "Xóa tất cả",
        "noSuccess": "Không có ảnh nào thành công để tải xuống.",
        "status": {
            // Creative Studio
            "queued": "Đang chờ",
            "running": "Đang xử lý",
            "success": "Thành công",
            "failed": "Thất bại",
            // ID Photo
            "pending": "Đang chờ",
            "processing": "Đang xử lý",
            "done": "Hoàn tất",
            "error": "Lỗi"
        },
        "retry": "Thử lại",
        "error": "Lỗi",
        "successResults": "Kết quả thành công",
        "progress": "{{completed}} / {{total}} tác vụ hoàn tất",
        "errors": {
            "queueFull": "Hàng đợi chỉ còn {{available}} chỗ trống. Chỉ {{available}} tác vụ đầu tiên từ tệp của bạn sẽ được thêm vào.",
            "txtEmpty": "Tệp TXT trống hoặc không chứa nội dung mô tả nào hợp lệ.",
            "csvInvalidRow": "Dòng {{row}} không hợp lệ: không đủ cột.",
            "csvInvalidData": "Dữ liệu không hợp lệ hoặc thiếu trong CSV tại dòng {{row}}: \"{{line}}\"",
            "jsonNotArray": "JSON phải là một mảng các tác vụ.",
            "jsonInvalidObject": "Đối tượng không hợp lệ trong JSON tại chỉ mục {{index}}: {{item}}",
            "unsupportedFormat": "Định dạng tệp không được hỗ trợ. Vui lòng sử dụng .txt, .csv hoặc .json.",
            "fileProcessingError": "Lỗi khi xử lý tệp: {{error}}"
        },

        // --- Keys for ID Photo Batch Processor ---
        "jobList": "Danh sách tác vụ",
        "statusSummary": "{{completed}}/{{total}} ảnh đã hoàn tất",
        "addPhotos": "Thêm ảnh",
        "clear": "Xóa hàng đợi",
        "settingsTitle": "Cài đặt hàng loạt",
        "processingAll": "Đang xử lý tất cả...",
        "generateAll": "Tạo tất cả ({{count}} ảnh)",
        "zoom": "Phóng to",
        "vipLock": {
            "title": "Tính năng VIP xử lý hàng loạt",
            "description": "Xử lý nhiều ảnh cùng lúc là một tính năng cao cấp. Vui lòng nâng cấp để sử dụng.",
            "button": "Liên hệ & Nâng cấp"
        },
        "ratios": {
            "ratio_9_16": "9:16 (Story/TikTok)",
            "ratio_1_1": "1:1 (Vuông/Avatar)",
            "ratio_16_9": "16:9 (Youtube/Ngang)",
            "ratio_4_3": "4:3 (Chân dung cổ điển)",
            "ratio_3_4": "3:4 (Chân dung điện thoại)"
        }
    }
}
