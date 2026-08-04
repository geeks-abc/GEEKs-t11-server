import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // B-2. 누적 임팩트 지표 + 일별 추이
  @Get('impact')
  impact() {
    return this.dashboardService.impact();
  }
}
