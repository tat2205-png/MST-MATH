export interface MathSample {
  id: string;
  title: string;
  grade: "Lớp 10" | "Lớp 11" | "Lớp 12" | "Ôn thi ĐGNL / THPT Quốc Gia";
  domain: string;
  topic: string;
  rawText: string;
  previewLatex: string;
}

export const HIGH_SCHOOL_MATH_SAMPLES: MathSample[] = [
  {
    id: "sample_geom_3d",
    title: "Hình chóp S.ABCD - Thể tích & Khoảng cách",
    grade: "Lớp 12",
    domain: "Hình học không gian",
    topic: "Thể tích khối chóp & Khoảng cách từ điểm tới mặt phẳng",
    rawText: `Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng đáy $(ABCD)$ và $SA = a\\sqrt{3}$.
a) Tính thể tích khối chóp $S.ABCD$ theo $a$.
b) Tính khoảng cách từ điểm $A$ đến mặt phẳng $(SBD)$.`,
    previewLatex: "S.ABCD, SA \\perp (ABCD), SA = a\\sqrt{3}, V_{S.ABCD} = ?",
  },
  {
    id: "sample_calculus_extrema",
    title: "Khảo sát hàm số bậc ba & Cực trị",
    grade: "Lớp 12",
    domain: "Đại số & Giải tích",
    topic: "Cực trị hàm số bậc ba & Viết phương trình tiếp tuyến",
    rawText: `Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$ có đồ thị là $(C)$.
a) Tìm tọa độ các điểm cực đại và cực tiểu của đồ thị $(C)$.
b) Viết phương trình tiếp tuyến của $(C)$ tại điểm uốn của đồ thị.`,
    previewLatex: "y = x^3 - 3x^2 + 2, \\quad y' = 3x^2 - 6x = 0",
  },
  {
    id: "sample_oxyz_sphere",
    title: "Tọa độ Oxyz - Mặt cầu & Mặt phẳng cắt",
    grade: "Lớp 12",
    domain: "Hình học tọa độ (Oxy/Oxyz)",
    topic: "Phương trình mặt cầu & Vị trí tương đối mặt phẳng",
    rawText: `Trong không gian với hệ tọa độ $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 25$ và mặt phẳng $(P): 2x - 2y + z + 1 = 0$.
a) Tìm tọa độ tâm $I$ và bán kính $R$ của mặt cầu $(S)$.
b) Chứng minh mặt phẳng $(P)$ cắt mặt cầu $(S)$ theo một đường tròn $(C)$ và tính bán kính $r$ của đường tròn $(C)$.`,
    previewLatex: "(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 25, \\quad (P): 2x - 2y + z + 1 = 0",
  },
  {
    id: "sample_trig_opt",
    title: "Lượng giác & Giá trị lớn nhất nhỏ nhất",
    grade: "Lớp 11",
    domain: "Lượng giác",
    topic: "Phương trình lượng giác & Min-Max",
    rawText: `Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số:
$y = f(x) = 2\\sin^2 x - \\cos x + 1$ trên đoạn $\\left[0; \\pi\\right]$.`,
    previewLatex: "y = 2\\sin^2 x - \\cos x + 1, \\quad x \\in [0, \\pi]",
  },
  {
    id: "sample_prob_comb",
    title: "Xác suất chọn bi - Biến cố đối",
    grade: "Lớp 11",
    domain: "Tổ hợp - Xác suất",
    topic: "Quy tắc đếm & Tính xác suất biến cố",
    rawText: `Một hộp chứa 5 viên bi đỏ, 6 viên bi xanh và 4 viên bi vàng có kích thước giống nhau. Lấy ngẫu nhiên đồng thời 4 viên bi từ hộp.
Tính xác suất để trong 4 viên bi lấy ra có đủ cả 3 màu.`,
    previewLatex: "P(A) = \\frac{n(A)}{n(\\Omega)}, \\quad n(\\Omega) = C_{15}^4",
  },
];
