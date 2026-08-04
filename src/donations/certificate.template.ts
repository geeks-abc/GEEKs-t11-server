export interface CertificateData {
  serialNumber: string;
  donor: { name: string; address: string };
  beneficiary: { name: string; type: string };
  itemName: string;
  quantity: number;
  weightKg: number;
  completedAt: Date;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

// B-1. 기부확인서 HTML 템플릿 (세제혜택 근거 자료 컨셉의 목업 — 발급기관 미연동)
export function renderCertificateHtml(data: CertificateData): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    color: #1a1a1a;
    padding: 60px 70px;
  }
  .frame { border: 3px double #2e7d32; padding: 48px 56px; min-height: 920px; }
  .serial { text-align: right; font-size: 12px; color: #666; }
  h1 {
    text-align: center; font-size: 34px; letter-spacing: 16px;
    margin: 36px 0 8px; color: #2e7d32;
  }
  .subtitle { text-align: center; font-size: 13px; color: #888; margin-bottom: 44px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
  th, td { border: 1px solid #ccc; padding: 12px 16px; font-size: 14px; text-align: left; }
  th { background: #f1f8e9; width: 130px; font-weight: 600; }
  .section-title { font-size: 15px; font-weight: 700; margin: 24px 0 10px; color: #2e7d32; }
  .statement { text-align: center; font-size: 15px; line-height: 2; margin: 44px 0; }
  .date { text-align: center; font-size: 14px; margin-bottom: 32px; }
  .issuer { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 4px; }
  .stamp {
    display: inline-block; border: 2px solid #c62828; color: #c62828;
    border-radius: 50%; width: 64px; height: 64px; line-height: 64px;
    font-size: 13px; margin-left: 12px; vertical-align: middle;
  }
  .footnote { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="frame">
    <div class="serial">일련번호: ${data.serialNumber}</div>
    <h1>기부확인서</h1>
    <div class="subtitle">Donation Certificate</div>

    <div class="section-title">기부자 (가게)</div>
    <table>
      <tr><th>상호</th><td>${data.donor.name}</td></tr>
      <tr><th>소재지</th><td>${data.donor.address}</td></tr>
    </table>

    <div class="section-title">수혜 시설</div>
    <table>
      <tr><th>시설명</th><td>${data.beneficiary.name}</td></tr>
      <tr><th>시설 유형</th><td>${data.beneficiary.type}</td></tr>
    </table>

    <div class="section-title">기부 내역</div>
    <table>
      <tr><th>품목</th><td>${data.itemName}</td></tr>
      <tr><th>수량</th><td>${data.quantity}개</td></tr>
      <tr><th>환산 중량</th><td>${data.weightKg}kg</td></tr>
      <tr><th>인수 일시</th><td>${formatDate(data.completedAt)}</td></tr>
    </table>

    <div class="statement">
      위와 같이 식품이 무상으로 기부되어<br />
      수혜 시설에 정상 인수되었음을 확인합니다.
    </div>

    <div class="date">${formatDate(data.completedAt)}</div>
    <div class="issuer">GEEKs 이음<span class="stamp">인</span></div>

    <div class="footnote">
      본 확인서는 해커톤 데모용 목업이며, 공식 발급기관과 연동되지 않았습니다.
    </div>
  </div>
</body>
</html>`;
}
