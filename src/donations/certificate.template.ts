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
    padding: 12mm;
    overflow: hidden;
    background: #ffffff;
    color: #191f28;
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .certificate {
    width: 100%;
    height: 273mm;
    padding: 10mm 11mm 8mm;
    border: 0.35mm solid #e9ecef;
    border-top: 2.2mm solid #ff6f0f;
    border-radius: 4mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .brand { color: #ff6f0f; font-size: 20px; font-weight: 800; letter-spacing: -0.6px; }
  .brand-sub { margin-top: 2px; color: #8b95a1; font-size: 8px; font-weight: 600; letter-spacing: 1.2px; }
  .serial { color: #8b95a1; font-size: 9px; text-align: right; line-height: 1.6; }
  .serial strong { display: block; color: #4e5968; font-size: 10px; font-weight: 700; }
  .hero { margin-top: 12mm; }
  .eyebrow { color: #ff6f0f; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; }
  h1 { margin-top: 3mm; color: #191f28; font-size: 29px; line-height: 1.25; font-weight: 800; letter-spacing: -1px; }
  .hero-description { margin-top: 3mm; color: #6b7684; font-size: 11px; line-height: 1.7; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-top: 10mm; }
  .party-card { min-height: 32mm; padding: 5mm; border-radius: 3.5mm; background: #f4f6f5; }
  .party-label { color: #8b95a1; font-size: 8.5px; font-weight: 700; }
  .party-name { margin-top: 3mm; color: #191f28; font-size: 15px; line-height: 1.35; font-weight: 800; }
  .party-meta {
    margin-top: 2mm;
    color: #6b7684;
    font-size: 9px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .section { margin-top: 9mm; }
  .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3.5mm; }
  .section-title { color: #191f28; font-size: 12px; font-weight: 800; }
  .complete-badge { padding: 1.5mm 3mm; border-radius: 10mm; background: #ffefe2; color: #c2560a; font-size: 8px; font-weight: 800; }
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 0.35mm solid #e9ecef;
    border-left: 0.35mm solid #e9ecef;
    border-radius: 3mm;
    overflow: hidden;
  }
  .detail {
    min-height: 20mm;
    padding: 4mm 5mm;
    border-right: 0.35mm solid #e9ecef;
    border-bottom: 0.35mm solid #e9ecef;
    background: #ffffff;
  }
  .detail.wide { grid-column: 1 / -1; }
  .detail-label { color: #8b95a1; font-size: 8.5px; font-weight: 600; }
  .detail-value { margin-top: 2mm; color: #191f28; font-size: 12px; line-height: 1.4; font-weight: 700; }
  .statement {
    margin-top: 7mm;
    padding: 5mm 6mm;
    border-radius: 3.5mm;
    background: #ffefe2;
    color: #7c3b10;
    font-size: 10px;
    line-height: 1.75;
    text-align: center;
  }
  .footer { margin-top: auto; }
  .issued { display: flex; align-items: center; justify-content: space-between; }
  .issued-date { color: #6b7684; font-size: 9px; line-height: 1.6; }
  .issued-date strong { display: block; color: #191f28; font-size: 11px; font-weight: 700; }
  .issuer { display: flex; align-items: center; gap: 3mm; }
  .issuer-copy { text-align: right; }
  .issuer-label { color: #8b95a1; font-size: 8px; }
  .issuer-name { margin-top: 1mm; color: #191f28; font-size: 13px; font-weight: 800; }
  .seal {
    width: 14mm;
    height: 14mm;
    border: 0.6mm solid #ff6f0f;
    border-radius: 50%;
    color: #ff6f0f;
    font-size: 8px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .footnote { margin-top: 5mm; padding-top: 3mm; border-top: 0.3mm solid #f2f4f6; color: #a3abb5; font-size: 7.5px; text-align: center; }
</style>
</head>
<body>
  <main class="certificate">
    <header class="topbar">
      <div>
        <div class="brand">이음</div>
        <div class="brand-sub">FOOD DONATION NETWORK</div>
      </div>
      <div class="serial">기부 완료 번호<strong>${serialNumber}</strong></div>
    </header>

    <section class="hero">
      <div class="eyebrow">DONATION CERTIFICATE</div>
      <h1>식품 기부 확인서</h1>
      <p class="hero-description">아래 식품이 기부자에게서 수혜 시설로 정상 전달되었음을 확인합니다.</p>
    </section>

    <section class="parties">
      <article class="party-card">
        <div class="party-label">기부한 곳</div>
        <div class="party-name">${donorName}</div>
        <div class="party-meta">${donorAddress}</div>
      </article>
      <article class="party-card">
        <div class="party-label">전달받은 곳</div>
        <div class="party-name">${beneficiaryName}</div>
        <div class="party-meta">${beneficiaryType}</div>
      </article>
    </section>

    <section class="section">
      <div class="section-head">
        <div class="section-title">기부 내역</div>
        <div class="complete-badge">전달 완료</div>
      </div>
      <div class="detail-grid">
        <div class="detail wide">
          <div class="detail-label">기부 상품</div>
          <div class="detail-value">${itemName}</div>
        </div>
        <div class="detail">
          <div class="detail-label">수량</div>
          <div class="detail-value">총 ${quantity}개</div>
        </div>
        <div class="detail">
          <div class="detail-label">환산 무게</div>
          <div class="detail-value">${weightKg}kg</div>
        </div>
        <div class="detail wide">
          <div class="detail-label">전달 완료 시간</div>
          <div class="detail-value">${completedAt}</div>
        </div>
      </div>
    </section>

    <p class="statement">위 기부 내역은 이음 서비스를 통해 정상적으로 전달 및 인수 처리되었습니다.</p>

    <footer class="footer">
      <div class="issued">
        <div class="issued-date">발급일<strong>${completedDate}</strong></div>
        <div class="issuer">
          <div class="issuer-copy">
            <div class="issuer-label">확인 기관</div>
            <div class="issuer-name">GEEKs 이음</div>
          </div>
          <div class="seal">확인</div>
        </div>
      </div>
      <div class="footnote">본 확인서는 이음 서비스의 전자 인수 기록을 바탕으로 발급된 데모용 문서입니다.</div>
    </footer>
  </main>
</body>
</html>`;
}
