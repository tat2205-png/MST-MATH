# MST-MATH Semantic Icon System V2.0

Status: **LOCKED / CANONICAL / APPROVED / HUMAN-APPROVED**  
Machine standard ID: `PIMATH-DNA-SEMANTIC-ICONS-V2.0`  
Product display name: `MST-MATH`

## Canonical rule

MST-MATH has exactly **one semantic icon system**. The machine-readable authority is `registry/pimath-dna-icons-v2.json`; the only semantic SVG master root is `assets/pimath-icons/canonical/v2/`.

Hard rules:

1. One semantic role = one meaning = one canonical SVG master.
2. Exactly 18 canonical roles are allowed.
3. Exactly 15 roles are `PRIMARY_PEDAGOGICAL`; exactly 3 are `SECONDARY_CONTENT`.
4. A block may display at most one primary pedagogical icon.
5. Word, PDF, HTML, Slides, Video and UI resolve the same role through the same registry.
6. Renderers may adapt format but may not substitute semantic identity.
7. Unknown or retired roles fail closed; there is no silent fallback and no compatibility-role alias in the canonical registry.
8. Cognitive level, real-world context, exploration mode and similar attributes are metadata, not new icon roles.
9. Modules may not own parallel semantic icon packs.
10. Decorative icons are outside this semantic registry and must never impersonate a canonical semantic role.

## Canonical roles

### Primary pedagogical — 15

1. `LEARNING_OBJECTIVE` — **Mục tiêu học tập**: mục tiêu cần đạt.
2. `CONCEPT` — **Kiến thức trọng tâm**: ý tưởng/khái niệm cốt lõi.
3. `DEFINITION` — **Định nghĩa**: phát biểu định nghĩa chính thức.
4. `FORMULA` — **Công thức**: công thức, hệ thức hoặc quy tắc toán học.
5. `EXAMPLE` — **Ví dụ**: ví dụ mẫu hoặc ví dụ minh họa.
6. `ACTIVITY` — **Hoạt động**: thao tác, quan sát, khám phá, thảo luận hoặc nhiệm vụ học tập.
7. `QUESTION` — **Câu hỏi**: câu hỏi/checkpoint kiểm tra nhận thức.
8. `EXERCISE` — **Bài tập**: nhiệm vụ toán học cần giải.
9. `REASONING` — **Tư duy / Suy luận**: học sinh phải tạo ra chuỗi lập luận hoặc kết nối logic để đi từ dữ kiện đến kết luận.
10. `TIP` — **Gợi ý**: hỗ trợ định hướng nhưng không lộ lời giải đầy đủ.
11. `NOTE` — **Ghi chú**: thông tin bổ sung.
12. `IMPORTANT` — **Quan trọng**: điểm cần nhấn mạnh hoặc cần nhớ.
13. `WARNING` — **Cảnh báo**: sai lầm thường gặp, điều kiện dễ bỏ sót hoặc nguy cơ hiểu sai.
14. `ANSWER` — **Đáp án**: kết quả cuối cùng.
15. `SOLUTION` — **Lời giải**: quy trình/các bước giải đầy đủ.

### Secondary content — 3

16. `GEOMETRY` — **Hình học**: marker cho nội dung/hình vẽ hình học.
17. `GRAPH` — **Đồ thị**: marker cho đồ thị, hệ trục hoặc biểu diễn hàm số.
18. `TABLE` — **Bảng**: marker cho bảng số liệu, bảng biến thiên hoặc dữ liệu dạng bảng.

## REASONING boundary

- `QUESTION` trả lời: **Kết quả/nhận định là gì?**
- `EXERCISE` trả lời: **Hãy giải nhiệm vụ toán học này.**
- `REASONING` trả lời: **Vì sao? Từ đâu suy ra? Lập luận thế nào?**

`REASONING` bao phủ justification, inference, proof, critique, comparison by reasoning và multi-step mathematical argument. Không tạo thêm các icon `PROOF`, `LOGIC`, `INFERENCE` hoặc `THINKING`.

## Metadata, not icons

Các khái niệm như application/vận dụng, exploration/khám phá, reflection, real-world context và cognitive level được lưu bằng metadata của nhiệm vụ. Chúng không được phép tạo thêm semantic icon role.

## Asset contract

Canonical master root: `assets/pimath-icons/canonical/v2/`.

Mỗi role phải trỏ đến đúng một SVG trong root trên. Không được đặt semantic SVG master ở renderer, module, Word profile, PDF profile hoặc UI package riêng.

## Governance / change control

Một role mới chỉ được xem xét khi đồng thời chứng minh được:

1. Không role hiện tại nào biểu đạt đúng ngữ nghĩa đó.
2. Khái niệm mới thực sự là semantic role, không phải metadata/context/cognitive level.
3. Role mới không trùng hoặc gần-trùng nghĩa với role hiện có.

Nếu không vượt đủ ba điều kiện, registry không thay đổi.
