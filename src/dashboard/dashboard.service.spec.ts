import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns impact totals and daily trend rows with co2e values', async () => {
    const donationRepo: any = {
      createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalDonations: '1',
          totalWeightKg: '5',
          storeCount: '2',
          facilityCount: '3',
        }),
        getRawMany: jest.fn().mockResolvedValue([
          {
            date: '2026-08-04',
            count: '1',
            weightKg: '5',
          },
        ]),
      })),
    };

    const service = new DashboardService(donationRepo);
    const result = await service.impact();

    expect(result).toEqual(
      expect.objectContaining({
        totalDonations: 1,
        totalWeightKg: 5,
        totalCo2eKg: 12.5,
        storeCount: 2,
        facilityCount: 3,
      }),
    );
    expect(result.daily).toEqual([
      {
        date: '2026-08-04',
        count: 1,
        weightKg: 5,
        co2eKg: 12.5,
      },
    ]);
  });
});
