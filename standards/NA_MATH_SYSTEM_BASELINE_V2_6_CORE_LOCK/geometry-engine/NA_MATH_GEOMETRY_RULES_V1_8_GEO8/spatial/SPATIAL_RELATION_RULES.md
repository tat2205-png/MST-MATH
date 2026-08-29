# GEO-7 — Spatial Relation Rendering Rules

## 1. Hai đường thẳng chéo nhau

Hai đường \(a,b\) chỉ được gắn semantic `skew` khi đồng thời:

\[
a\cap b=\varnothing,
\]

\[
a\not\parallel b,
\]

và \(a,b\) không đồng phẳng.

Hình chiếu 2D của hai đường chéo nhau **có thể cắt nhau**.
Điểm cắt trên màn hình không phải là giao điểm 3D.

Do đó:
- không đặt điểm tại giao cắt hình chiếu;
- không ghi \(a\cap b=M\);
- không tự dựng đoạn vuông góc chung.

---

## 2. Hai đường chéo nhau trên hai mặt phẳng song song

Nếu

\[
(P)\parallel(Q),\qquad a\subset(P),\qquad b\subset(Q),\qquad a\not\parallel b,
\]

thì profile chuẩn phải:
- biểu diễn hai mặt phẳng cùng family hướng;
- tách nhau bằng phép tịnh tiến trong hình chiếu;
- vẽ \(a,b\) với hai hướng chiếu không song song;
- không nối hai mặt phẳng bằng các đoạn trang trí;
- không tạo cảm giác đây là lăng trụ;
- không đánh dấu giao điểm giả.

---

## 3. Đường thẳng song song mặt phẳng

Nếu \(a\parallel(P)\):
- semantic model quyết định không có giao điểm;
- hình chiếu của \(a\) có thể đè lên vùng biểu diễn của \((P)\);
- renderer vẫn không được tạo giao điểm nếu semantic không có.

---

## 4. Đường thẳng cắt mặt phẳng

Nếu

\[
a\cap(P)=\{M\},
\]

thì \(M\) là giao điểm duy nhất.
Renderer không được di chuyển \(M\) vì lý do thẩm mỹ.

---

## 5. Đường thẳng vuông góc mặt phẳng

Nếu

\[
a\perp(P),\qquad a\cap(P)=\{H\},
\]

thì \(H\) là chân vuông góc.

Lưu ý:
- vuông góc trong không gian không đồng nghĩa với đoạn phải vertical trên màn hình;
- chỉ profile cụ thể mới được phép ép vertical;
- dấu vuông góc chỉ xuất hiện khi quan hệ đã VERIFIED.

---

## 6. Hai mặt phẳng song song

Hai mặt phẳng song song:
- có cùng family hướng chiếu;
- các cạnh biểu diễn tương ứng song song;
- có khoảng tách rõ;
- không có các cạnh nối giữa hai hình bình hành biểu diễn.

---

## 7. Hai mặt phẳng cắt nhau

Nếu

\[
(P)\cap(Q)=d,
\]

thì \(d\) phải là đường chung thật sự của cả hai mặt phẳng.
Không được vẽ hai hình bình hành chỉ "đè lên nhau" rồi gọi đó là hai mặt phẳng cắt nhau.

---

## 8. Hard QA

Mọi hình spatial relation phải kiểm tra:
- semantic relation trước;
- projection sau;
- false intersection;
- false connector;
- fake prism implication;
- right-angle marker provenance;
- label collision;
- V1.3 layout isolation.
