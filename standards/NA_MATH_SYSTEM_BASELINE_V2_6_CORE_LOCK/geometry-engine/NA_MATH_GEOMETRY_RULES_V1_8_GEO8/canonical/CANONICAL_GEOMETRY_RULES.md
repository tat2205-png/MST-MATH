# GEO-6 — Canonical Prism / Box / Trapezoid Rules

## 1. Lăng trụ

Hai đáy không được dựng độc lập.

Nếu đáy thứ nhất có các đỉnh

\[
A_1,A_2,\ldots,A_n,
\]

thì đáy thứ hai phải được tạo bằng cùng một vectơ biểu diễn \(v\):

\[
A_i' = A_i + v.
\]

Do đó:
- mọi cạnh bên cùng phương;
- các cạnh tương ứng của hai đáy song song;
- không có hiệu ứng hội tụ phối cảnh.

### Lăng trụ tam giác profile đã khóa

Với \(ABC.A'B'C'\):

- \(C,C'\) là các đỉnh phía trước theo profile đã duyệt;
- \(AB\) là cạnh khuất của đáy dưới;
- `AB` là nét đứt duy nhất;
- `CA, CB, C′A′, C′B′, CC′, AA′, BB′, A′B′` là nét liền.

---

## 2. Lăng trụ N giác

Hỗ trợ \(3\le N\le10\).

Topology:

\[
V=2N,\qquad E=3N,\qquad F=N+2.
\]

Không tự giả sử đa giác đáy đều nếu đề không cho.

---

## 3. Hình hộp

`ABCD.A′B′C′D′` phải được dựng bằng phép tịnh tiến chung từ một mặt sang mặt tương ứng.

Ba lớp song song:

\[
AB\parallel CD\parallel A'B'\parallel C'D',
\]

\[
AD\parallel BC\parallel A'D'\parallel B'C',
\]

\[
AA'\parallel BB'\parallel CC'\parallel DD'.
\]

### Phân loại semantic

- Hình hộp: ba lớp cạnh song song.
- Hình hộp chữ nhật: phải có quan hệ vuông góc được GIVEN/DERIVED.
- Hình lập phương: hình hộp chữ nhật + các cạnh cần thiết bằng nhau đã VERIFIED.

Không được nhìn hình chiếu là hình bình hành rồi kết luận mặt thật là hình bình hành đặc biệt hơn.

---

## 4. Hình thang

Profile khóa:

`TRAPEZOID_BASE_LARGE_TOP_HORIZONTAL`

Nếu

\[
AB\parallel CD,\qquad AB>CD,
\]

thì:
- \(AB\) là đáy lớn;
- \(AB\) horizontal;
- \(AB\) nằm phía trên;
- \(CD\) nằm phía dưới;
- nếu đề cho số đo, tỉ lệ biểu diễn phải đúng theo cùng một scale.

Ví dụ:

\[
AB=8,\qquad CD=4
\]

thì

\[
\frac{|AB|_{\text{render}}}{|CD|_{\text{render}}}=2.
\]

Không tự:
- căn giữa đáy nhỏ;
- dựng hình thang cân;
- dựng hình thang vuông;
- thêm trục đối xứng.

---

## 5. Visibility

Canonical builder KHÔNG tự quyết định nét đứt.

Builder:
semantic/projected geometry

GEO-3:
View Profile → solid/dashed

Đây là hai tầng độc lập.
