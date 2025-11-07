import React from 'react';

interface RegistrationModalProps {
    onRegister: () => void;
    onClose: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ onRegister, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] p-6 md:p-8 relative text-white border border-gray-700 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <i className="fas fa-times fa-lg"></i>
                </button>
                <div className="text-amber-300 mb-4">
                    <i className="fas fa-lock fa-3x"></i>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-amber-300">Tính Năng Yêu Cầu Đăng Ký</h2>
                <p className="text-gray-300 mb-6">
                    Công cụ "Phục hồi ảnh cũ" là một tính năng cao cấp. Vui lòng đăng ký (miễn phí) để mở khóa và sử dụng.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all duration-300"
                    >
                        Để sau
                    </button>
                    <button 
                        onClick={onRegister} 
                        className="w-full bg-amber-400 text-stone-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-300 transition-all duration-300 shadow-lg"
                    >
                        Đăng Ký & Sử Dụng Ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationModal;
