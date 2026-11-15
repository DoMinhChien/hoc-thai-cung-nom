/**
 * Mọi chuỗi hiển thị của app (AGENTS.md mục 7). Không viết chuỗi tiếng Việt trực tiếp trong component.
 */
export const vi = {
  app: {
    name: 'Học Thai cùng Nôm',
    logoAlt: 'Logo Học Thai cùng Nôm',
  },
  nav: {
    label: 'Điều hướng chính',
    dashboard: 'Tổng quan',
    alphabet: 'Bảng chữ cái',
    tones: 'Thanh điệu',
    vocab: 'Từ vựng',
    review: 'Ôn tập',
    reading: 'Đọc',
    listening: 'Nghe',
    games: 'Trò chơi',
    progress: 'Tiến độ',
    settings: 'Cài đặt',
    account: 'Tài khoản',
  },
  pages: {
    login: 'Đăng nhập',
    account: 'Tài khoản',
    privacy: 'Chính sách quyền riêng tư',
    terms: 'Điều khoản sử dụng',
    deleteInstructions: 'Hướng dẫn xóa dữ liệu',
    dashboard: 'Tổng quan',
    alphabet: 'Bảng chữ cái',
    alphabetPractice: 'Luyện chữ',
    tones: 'Luyện thanh điệu',
    vocab: 'Bộ từ vựng',
    vocabDeck: 'Học từ mới',
    review: 'Ôn tập',
    reading: 'Đọc',
    readingDetail: 'Bài đọc',
    listening: 'Quiz nghe',
    games: 'Trò chơi',
    game: 'Màn chơi',
    progress: 'Báo cáo tiến độ',
    settings: 'Cài đặt',
    notFound: 'Không tìm thấy trang',
    typography: 'Kiểm tra font chữ',
  },
  common: {
    comingSoon: 'Màn hình này đang được xây dựng.',
    backHome: 'Về trang Tổng quan',
  },
  typography: {
    intro: 'Mẫu chữ Thái có dấu chồng — kiểm tra dấu trên/dưới không bị cắt.',
    vietnameseSample: 'Tiếng Việt: Học tiếng Thái mỗi ngày — ắ ặ ẫ ỡ ự Ứ Ỷ',
    sizeLabel: 'Cỡ {size}px',
  },
} as const;

export type Messages = typeof vi;
