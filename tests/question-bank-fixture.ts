import { zipSync } from "fflate";
const enc = new TextEncoder();
export function createQuestionDocx(): Uint8Array {
  const document = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="w" xmlns:m="m" xmlns:a="a" xmlns:r="r"><w:body>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:b/><w:t>PHẦN I. TRẮC NGHIỆM</w:t></w:r></w:p>
  <w:p><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:b/><w:t>Câu 1. Giá trị của </w:t></w:r><m:oMath><m:f><m:num><m:r><m:t>x+1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f></m:oMath><w:r><w:t> là</w:t></w:r></w:p>
  <w:p><w:r><w:t>A. 1 B. 2 C. 3 D. 4</w:t></w:r><w:drawing><a:blip r:embed="rId1"/></w:drawing></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:b/><w:t>PHẦN II. ĐÚNG/SAI</w:t></w:r></w:p>
  <w:p><w:r><w:b/><w:t>Câu 2: Xét hàm số </w:t></w:r><m:oMathPara><m:oMath><m:sSup><m:e><m:r><m:t>x</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath></m:oMathPara></w:p>
  <w:tbl><w:tr><w:tc><w:p><w:r><w:t>a) Hàm số xác định trên ℝ</w:t></w:r><w:drawing><wp:anchor xmlns:wp="wp"><wp:extent cx="100" cy="200"/><a:blip r:embed="rId2"/></wp:anchor></w:drawing></w:p></w:tc><w:tc><w:p><w:r><w:t>b) Hàm số luôn âm</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>PHẦN III. TRẢ LỜI NGẮN</w:t></w:r></w:p>
  <w:p><w:r><w:b/><w:t>Câu 3. Tính tọa độ điểm A(1;2).</w:t></w:r></w:p>
  <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>PHẦN IV. TỰ LUẬN</w:t></w:r></w:p>
  <w:p><w:r><w:b/><w:t>Bài 4) Cho tam giác ABC. a) Chứng minh hệ thức. b) Tính độ dài.</w:t></w:r></w:p>
  <w:p><w:r><w:t>Lời giải: Giữ nguyên giả thiết và thực hiện theo từng ý.</w:t></w:r></w:p>
  </w:body></w:document>`;
  const rels = `<Relationships><Relationship Id="rId1" Target="media/figure1.png" Type="image"/><Relationship Id="rId2" Target="media/figure2.svg" Type="image"/></Relationships>`;
  return zipSync({ "word/document.xml": enc.encode(document), "word/_rels/document.xml.rels": enc.encode(rels), "word/media/figure1.png": new Uint8Array([137,80,78,71]), "word/media/figure2.svg": enc.encode("<svg/>"), "word/media/orphan.png": new Uint8Array([137,80,78,71,1]) });
}
