/**
 * Nội dung trang pháp lý (SCR-02 B). **Bản nháp — owner duyệt trước go-live (M12).**
 * Tách khỏi `vi.ts` vì là văn bản dài có cấu trúc (mục → đoạn / danh sách).
 */
export const CONTACT_EMAIL = 'dominhchien206@gmail.com';
export const LEGAL_UPDATED = '15/11/2026';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  /** Danh sách có thứ tự (các bước). */
  steps?: string[];
};

export type LegalDocument = { title: string; sections: LegalSection[] };

const contact: LegalSection = {
  id: 'lien-he',
  title: 'Liên hệ',
  paragraphs: [`Mọi câu hỏi về trang này, vui lòng gửi email tới ${CONTACT_EMAIL}.`],
};

export const privacyVi: LegalDocument = {
  title: 'Chính sách quyền riêng tư',
  sections: [
    {
      id: 'thu-thap',
      title: 'Chúng tôi thu thập gì',
      paragraphs: [
        'Khi bạn đăng nhập bằng Google, chúng tôi nhận từ Google: tên, địa chỉ email và ảnh đại diện của bạn. Chúng tôi không nhận mật khẩu của bạn.',
        'Nếu bạn dùng ứng dụng mà không đăng nhập, chúng tôi không thu thập thông tin cá nhân nào.',
      ],
    },
    {
      id: 'muc-dich',
      title: 'Dùng để làm gì',
      items: [
        'Đăng nhập và giữ phiên đăng nhập của bạn.',
        'Hiển thị tên và ảnh đại diện của bạn trong ứng dụng.',
      ],
    },
    {
      id: 'tien-do',
      title: 'Tiến độ học lưu ở đâu',
      paragraphs: [
        'Tiến độ học (thẻ đã học, lịch ôn, kết quả luyện tập) chỉ được lưu trên trình duyệt của bạn (IndexedDB), tách riêng theo từng tài khoản. Chúng tôi không gửi tiến độ học lên máy chủ.',
        'Bạn có thể tự xuất tiến độ ra một tệp JSON (Cài đặt › Dữ liệu tiến độ) và nhập lại sau. Tệp này nằm trên máy của bạn; chúng tôi không nhận được tệp.',
      ],
    },
    {
      id: 'ben-thu-ba',
      title: 'Dịch vụ bên thứ ba',
      items: [
        'Firebase Authentication (Google) — xác thực đăng nhập.',
        'Azure Static Web Apps (Microsoft) — lưu trữ và phân phối trang web.',
      ],
    },
    {
      id: 'cam-ket',
      title: 'Cam kết',
      items: [
        'Không bán dữ liệu của bạn.',
        'Không hiển thị quảng cáo.',
        'Không dùng công cụ phân tích hành vi người dùng.',
      ],
    },
    {
      id: 'quyen',
      title: 'Quyền của bạn và cách xoá dữ liệu',
      paragraphs: [
        'Bạn có thể xoá tài khoản và toàn bộ tiến độ học bất cứ lúc nào trong trang Tài khoản. Xem hướng dẫn chi tiết tại trang Hướng dẫn xoá dữ liệu (/account/delete-instructions).',
      ],
    },
    contact,
  ],
};

export const termsVi: LegalDocument = {
  title: 'Điều khoản sử dụng',
  sections: [
    {
      id: 'gioi-thieu',
      title: 'Giới thiệu dịch vụ',
      paragraphs: [
        'Học Thai cùng Nôm là ứng dụng web miễn phí giúp người Việt học tiếng Thái bằng flashcard, trò chơi, hình ảnh và mẹo nhớ.',
      ],
    },
    {
      id: 'tai-khoan',
      title: 'Tài khoản',
      paragraphs: [
        'Bạn có thể dùng ứng dụng không cần tài khoản, hoặc đăng nhập bằng Google. Bạn chịu trách nhiệm giữ an toàn cho tài khoản Google của mình.',
      ],
    },
    {
      id: 'noi-dung',
      title: 'Nội dung học',
      paragraphs: [
        'Nội dung học được biên soạn từ giáo trình, được sử dụng với sự đồng ý của giáo viên. Bạn chỉ dùng nội dung cho mục đích học tập cá nhân.',
      ],
    },
    {
      id: 'su-dung',
      title: 'Sử dụng hợp lý',
      items: [
        'Không tìm cách phá hoại, can thiệp hoặc làm gián đoạn dịch vụ.',
        'Không sao chép hàng loạt nội dung để phân phối lại.',
      ],
    },
    {
      id: 'trach-nhiem',
      title: 'Giới hạn trách nhiệm',
      paragraphs: [
        'Ứng dụng được cung cấp "nguyên trạng". Tiến độ học lưu trên trình duyệt có thể mất nếu bạn xoá dữ liệu trình duyệt; hãy dùng chức năng xuất dữ liệu để sao lưu.',
      ],
    },
    {
      id: 'thay-doi',
      title: 'Thay đổi điều khoản',
      paragraphs: ['Điều khoản có thể được cập nhật. Ngày cập nhật gần nhất ghi ở đầu trang.'],
    },
    contact,
  ],
};

export const deleteInstructionsVi: LegalDocument = {
  title: 'Hướng dẫn xoá dữ liệu',
  sections: [
    {
      id: 'cac-buoc',
      title: 'Xoá tài khoản trong ứng dụng',
      steps: [
        'Đăng nhập vào Học Thai cùng Nôm.',
        'Vào Tài khoản → Vùng nguy hiểm → Xoá tài khoản.',
        'Gõ XOÁ để xác nhận.',
      ],
      paragraphs: ['Tài khoản và toàn bộ tiến độ học trên trình duyệt đó sẽ bị xoá vĩnh viễn.'],
    },
    {
      id: 'khong-dang-nhap-duoc',
      title: 'Nếu không đăng nhập được',
      paragraphs: [
        `Gửi email tới ${CONTACT_EMAIL} kèm địa chỉ email của tài khoản. Yêu cầu được xử lý trong 30 ngày.`,
      ],
    },
    {
      id: 'go-quyen',
      title: 'Gỡ quyền truy cập của ứng dụng',
      paragraphs: [
        'Google: vào myaccount.google.com → Bảo mật → Ứng dụng và dịch vụ bên thứ ba → gỡ "Học Thai cùng Nôm".',
      ],
    },
  ],
};
