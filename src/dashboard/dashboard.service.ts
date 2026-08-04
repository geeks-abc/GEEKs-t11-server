import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../donations/entities/donation.entity';
import { CO2E_PER_KG } from '../common/constants';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  // B-2. 임팩트 대시보드
  async impact() {
    const totals = await this.donationRepo
      .createQueryBuilder('donation')
      .innerJoin('donation.match', 'match')
      .innerJoin('match.listing', 'listing')
      .select('COUNT(donation.id)', 'totalDonations')
      .addSelect('COALESCE(SUM(donation.weightKg), 0)', 'totalWeightKg')
      .addSelect('COUNT(DISTINCT listing.storeId)', 'storeCount')
      .addSelect('COUNT(DISTINCT match.facilityId)', 'facilityCount')
      .getRawOne<{
        totalDonations: string;
        totalWeightKg: string;
        storeCount: string;
        facilityCount: string;
      }>();

    // 일별 추이 (건수·kg·CO2e)
    const daily = await this.donationRepo
      .createQueryBuilder('donation')
      .select('DATE(donation.completedAt)', 'date')
      .addSelect('COUNT(donation.id)', 'count')
      .addSelect('SUM(donation.weightKg)', 'weightKg')
      .groupBy('DATE(donation.completedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const totalWeightKg = Number(totals?.totalWeightKg ?? 0);
    return {
      totalDonations: Number(totals?.totalDonations ?? 0),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalCo2eKg: Number((totalWeightKg * CO2E_PER_KG).toFixed(2)),
      storeCount: Number(totals?.storeCount ?? 0),
      facilityCount: Number(totals?.facilityCount ?? 0),
      daily: daily.map((row) => {
        const weightKg = Number(row.weightKg ?? 0);
        return {
          date: row.date,
          count: Number(row.count),
          weightKg: Number(weightKg.toFixed(2)),
          co2eKg: Number((weightKg * CO2E_PER_KG).toFixed(2)),
        };
      }),
    };
  }
}
