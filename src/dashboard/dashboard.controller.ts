import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('대시보드')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // B-2. 누적 임팩트 지표 + 일별 추이
  @ApiOperation({
    summary: '임팩트 대시보드 (B-2)',
    description:
      '누적 기부 건수·감축량(kg)·CO₂e 환산·참여 가게/시설 수·일별 추이. 환산 규칙: 품목 키워드별 평균 중량 × 수량, CO₂e 계수 2.5/kg.',
  })
  @Get('impact')
  impact() {
    return this.dashboardService.impact();
  }
}
