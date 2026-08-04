// B-2 임팩트 환산 규칙: 품목당 평균 중량(kg) × 수량
// 키워드 매칭으로 평균 중량 추정, 없으면 기본값 사용
export const ITEM_AVG_WEIGHT_KG: Record<string, number> = {
  빵: 0.1,
  베이글: 0.1,
  케이크: 0.5,
  샌드위치: 0.2,
  샐러드: 0.3,
  도시락: 0.5,
  우유: 1.0,
  음료: 0.5,
};

export const DEFAULT_ITEM_WEIGHT_KG = 0.3;

// 식품 폐기 1kg당 CO2e 환산계수 (발표자료에 출처 명기)
export const CO2E_PER_KG = 2.5;

export function estimateWeightKg(itemName: string, quantity: number): number {
  const matched = Object.entries(ITEM_AVG_WEIGHT_KG).find(([keyword]) =>
    itemName.includes(keyword),
  );
  const unitWeight = matched ? matched[1] : DEFAULT_ITEM_WEIGHT_KG;
  return Number((unitWeight * quantity).toFixed(2));
}
