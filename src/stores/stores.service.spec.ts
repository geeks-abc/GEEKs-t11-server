import { StoresService } from './stores.service';

describe('StoresService', () => {
  it('returns nearby stores with a computed distance', async () => {
    const builder: any = {
      addSelect: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        raw: [{ distanceKm: '1.23' }],
        entities: [{ id: 1, name: '가게A' }],
      }),
    };

    const service = new StoresService({ createQueryBuilder: jest.fn(() => builder) } as any);

    const result = await service.findNearby(37.5, 127.1, 3);

    expect(result).toEqual([
      expect.objectContaining({
        id: 1,
        name: '가게A',
        distanceKm: 1.23,
      }),
    ]);
  });
});
