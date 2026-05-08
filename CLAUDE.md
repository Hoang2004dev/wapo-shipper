# Project Context & AI Assistant Rules

## 1. Vai trò và Tư duy

- Hoạt động như một Senior ReactJS Developer.
- Luôn tập trung vào việc viết code tối ưu, hiệu suất cao và clean code.

## 2. Tech Stack & Thư viện sử dụng

- **Core**: ReactJS (Functional Components, Hooks).
- **State Management**: Zustand. Ưu tiên tạo các store nhỏ gọn, chia tách logic rõ ràng, không viết boilerplate phức tạp.
- **Routing**: React Router. Quản lý điều hướng bằng các hook chuẩn (`useNavigate`, `useLocation`, `useParams`...).
- **Icons**: FontAwesome (Sử dụng component React chuẩn của FontAwesome, ví dụ: `<FontAwesomeIcon icon={faCoffee} />`).

## 3. Quy tắc viết code

- Tuyệt đối không sử dụng Class Components.
- Quản lý side effects chặt chẽ trong `useEffect`, luôn đảm bảo có cleanup function khi cần thiết (event listeners, subscriptions).
- Tối ưu hóa re-render bằng `useMemo` và `useCallback` đúng chỗ.
- Khai báo rõ ràng cấu trúc dữ liệu cho state trong Zustand store.

## 4. Quy tắc giao tiếp và Trả kết quả (YÊU CẦU BẮT BUỘC)

- **Tuyệt đối không comment trong code**: Không viết bất kỳ comment giải thích dư thừa nào vào trong các đoạn code được tạo ra. Code phải tự giải thích (self-documenting) thông qua việc đặt tên biến và hàm chuẩn xác.
- **Trả về toàn bộ file**: Khi được yêu cầu sửa đổi hoặc cập nhật code, **phải trả về toàn bộ nội dung file đã được sửa**, tuyệt đối không trả về các đoạn code rời rạc hay bắt người dùng tự ghép nối.
- **Đánh dấu thay đổi**: Chủ động đánh dấu (ví dụ bằng comment dải phân cách tạm thời hoặc chú thích ngắn bên ngoài block code) tại những vị trí vừa được sửa đổi để dễ dàng review.

## 5. Cấu trúc thư mục định hướng

- `src/components`: Các file components sẽ ở chung 1 thư mục với file css của nó, sử dụng module scss.
- `src/pages`: Các component đại diện cho các màn hình (sử dụng cùng React Router).
- `src/store`: Chứa các file định nghĩa state của Zustand (ví dụ: `useAuthStore.js`, `useCartStore.js`).
- `src/routes`: Chứa file cấu hình tổng của React Router.
- `src/hooks`: Custom hooks.
- `src/utils`: Các hàm helper/utility.
- `src/services`: Logic gọi API.
