import { BadRequestException } from '@nestjs/common';
import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let listingRepo: any;
  let facilitiesService: any;

  beforeEach(() => {
    listingRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    facilitiesService = {
      findOne: jest.fn(),
    };
    service = new ListingsService(listingRepo, facilitiesService);
  });

  it('rejects a listing when pickupStart is later than pickupEnd', async () => {
    const pickupStart = new Date(Date.now() + 60 * 60 * 1000);
    const pickupEnd = new Date(Date.now() + 30 * 60 * 1000);

    await expect(
      service.create({
        storeId: 1,
        itemName: '빵',
        quantity: 3,
        pickupStart,
        pickupEnd,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
