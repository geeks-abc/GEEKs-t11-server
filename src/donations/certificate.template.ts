export interface CertificateData {
  serialNumber: string;
  donor: { name: string; address: string };
  beneficiary: { name: string; type: string };
  itemName: string;
  quantity: number;
  weightKg: number;
  completedAt: Date;
}

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

// B-1. 기부확인서 HTML 템플릿 — A4 한 페이지 고정
export function renderCertificateHtml(data: CertificateData): string {
  const serialNumber = escapeHtml(data.serialNumber);
  const donorName = escapeHtml(data.donor.name);
  const donorAddress = escapeHtml(data.donor.address);
  const beneficiaryName = escapeHtml(data.beneficiary.name);
  const beneficiaryType = escapeHtml(data.beneficiary.type);
  const itemName = escapeHtml(data.itemName);
  const quantity = escapeHtml(data.quantity);
  const weightKg = escapeHtml(data.weightKg);
  const completedAt = escapeHtml(formatDateTime(data.completedAt));
  const completedDate = escapeHtml(formatDate(data.completedAt));

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; }
  body {
    padding: 14mm;
    overflow: hidden;
    background: #ffffff;
    color: #202124;
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .certificate {
    width: 100%;
    height: 269mm;
    padding: 11mm 12mm 9mm;
    border: 0.3mm solid #cfd4da;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { color: #ff6f0f; font-size: 19px; font-weight: 800; letter-spacing: -0.5px; }
  .document-number { color: #6f7782; font-size: 8.5px; line-height: 1.6; text-align: right; }
  .document-number strong { display: block; color: #202124; font-size: 9.5px; font-weight: 700; }
  .title-area { margin-top: 16mm; text-align: center; }
  h1 { font-size: 27px; font-weight: 800; letter-spacing: 5px; }
  .subtitle { margin-top: 3mm; color: #6f7782; font-size: 9.5px; letter-spacing: 0.4px; }
  .title-rule { width: 18mm; height: 0.8mm; margin: 6mm auto 0; background: #ff6f0f; }
  .intro { margin-top: 12mm; color: #4f5660; font-size: 10.5px; line-height: 1.8; text-align: center; }
  .section-title {
    margin-top: 10mm;
    margin-bottom: 3mm;
    padding-left: 3mm;
    border-left: 0.9mm solid #ff6f0f;
    color: #202124;
    font-size: 11px;
    font-weight: 700;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 0.25mm solid #bbc1c8; padding: 3.5mm 4mm; font-size: 9.5px; line-height: 1.55; }
  th { background: #f5f6f7; color: #4f5660; font-weight: 700; text-align: center; }
  td { color: #202124; font-weight: 500; }
  .group { width: 25mm; background: #eef0f2; color: #202124; font-size: 10px; }
  .label { width: 27mm; }
  .statement {
    margin-top: 12mm;
    padding: 7mm 4mm;
    border-top: 0.25mm solid #cfd4da;
    border-bottom: 0.25mm solid #cfd4da;
    color: #30343a;
    font-size: 11px;
    line-height: 1.9;
    text-align: center;
  }
  .statement strong { font-weight: 700; }
  .approval { margin-top: auto; }
  .issued-date { text-align: center; color: #30343a; font-size: 10.5px; }
  .issuer-row { margin-top: 8mm; display: flex; justify-content: flex-end; align-items: center; }
  .issuer { min-width: 65mm; text-align: center; }
  .issuer-label { color: #6f7782; font-size: 8.5px; }
  .issuer-name { margin-top: 2mm; color: #202124; font-size: 14px; font-weight: 800; letter-spacing: 1px; }
  .seal {
    width: 15mm;
    height: 15mm;
    margin-left: -7mm;
    border: 0.55mm solid #ff6f0f;
    border-radius: 50%;
    color: #ff6f0f;
    font-size: 8px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-8deg);
  }
  .footnote { margin-top: 8mm; padding-top: 3mm; border-top: 0.2mm solid #e1e4e8; color: #9299a2; font-size: 7.5px; text-align: center; }
</style>
</head>
<body>
  <main class="certificate">
    <header class="header">
      <div class="brand">이음</div>
      <div class="document-number">기부 완료 번호<strong>${serialNumber}</strong></div>
    </header>

    <section class="title-area">
      <h1>식품 기부 확인서</h1>
      <div class="subtitle">식품 기부 및 인수 완료 내역</div>
      <div class="title-rule"></div>
    </section>

    <p class="intro">다음과 같이 식품이 무상 기부되어 수혜 시설에 정상적으로 전달되었음을 확인합니다.</p>

    <div class="section-title">기부 및 인수 정보</div>
    <table aria-label="기부 및 인수 정보">
      <tr>
        <th class="group" rowspan="2">기부자</th>
        <th class="label">상호</th>
        <td>${donorName}</td>
      </tr>
      <tr>
        <th class="label">소재지</th>
        <td>${donorAddress}</td>
      </tr>
      <tr>
        <th class="group" rowspan="2">수혜 시설</th>
        <th class="label">시설명</th>
        <td>${beneficiaryName}</td>
      </tr>
      <tr>
        <th class="label">시설 유형</th>
        <td>${beneficiaryType}</td>
      </tr>
    </table>

    <div class="section-title">기부 내역</div>
    <table aria-label="기부 내역">
      <tr>
        <th class="label">품목</th>
        <td>${itemName}</td>
      </tr>
      <tr>
        <th class="label">수량</th>
        <td>총 ${quantity}개</td>
      </tr>
      <tr>
        <th class="label">환산 중량</th>
        <td>${weightKg}kg</td>
      </tr>
      <tr>
        <th class="label">인수 일시</th>
        <td>${completedAt}</td>
      </tr>
    </table>

    <p class="statement">위 기부 내역이 이음 서비스를 통해 <strong>정상적으로 전달 및 인수 처리</strong>되었음을 확인합니다.</p>

    <footer class="approval">
      <div class="issued-date">${completedDate}</div>
      <div class="issuer-row">
        <div class="issuer">
          <div class="issuer-label">확인 기관</div>
          <div class="issuer-name">GEEKs 이음</div>
        </div>
        <div class="seal">확인</div>
      </div>
      <div class="footnote">본 확인서는 이음 서비스의 전자 인수 기록을 바탕으로 발급된 데모용 문서입니다.</div>
    </footer>
  </main>
</body>
</html>`;
}
