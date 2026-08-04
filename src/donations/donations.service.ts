import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  findByStore(storeId: number) {
    return this.donationRepo.find({
      where: { match: { listing: { storeId } } },
      relations: { match: { listing: { store: true }, facility: true } },
      order: { completedAt: 'DESC' },
    });
  }

  // B-1. 기부확인서 데이터 (PDF 렌더링은 클라이언트/추후 처리, 목업 컨셉)
  async certificate(id: number) {
    const donation = await this.donationRepo.findOne({
      where: { id },
      relations: { match: { listing: { store: true }, facility: true } },
    });
    if (!donation) throw new NotFoundException('기부 내역을 찾을 수 없습니다.');

    const { match } = donation;
    return {
      serialNumber: `GEEKS-${donation.completedAt.getFullYear()}-${String(donation.id).padStart(6, '0')}`,
      donor: {
        name: match.listing.store.name,
        address: match.listing.store.address,
      },
      beneficiary: {
        name: match.facility.name,
        type: match.facility.type,
      },
      itemName: match.listing.itemName,
      quantity: match.listing.quantity,
      weightKg: donation.weightKg,
      completedAt: donation.completedAt,
    };
  }
}
