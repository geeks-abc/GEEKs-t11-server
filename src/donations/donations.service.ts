import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import puppeteer, { Browser } from 'puppeteer';
import { Donation } from './entities/donation.entity';
import { renderCertificateHtml } from './certificate.template';

@Injectable()
export class DonationsService implements OnModuleDestroy {
  private browser: Browser | null = null;

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  async onModuleDestroy() {
    await this.browser?.close();
  }

  // 가게(storeId) 또는 시설(facilityId) 기준 완료 내역
  findAll(filter: { storeId?: number; facilityId?: number }) {
    return this.donationRepo.find({
      where: {
        match: {
          ...(filter.storeId && { listing: { storeId: filter.storeId } }),
          ...(filter.facilityId && { facilityId: filter.facilityId }),
        },
      },
      relations: { match: { listing: { store: true }, facility: true } },
      order: { completedAt: 'DESC' },
    });
  }

  // B-1. 기부확인서 데이터
  async certificate(id: number) {
    const donation = await this.donationRepo.findOne({
      where: { id },
      relations: { match: { listing: { store: true }, facility: true } },
    });
    if (!donation) throw new NotFoundException('기부 내역을 찾을 수 없습니다.');

    const { match } = donation;
    return {
      serialNumber: `IEUM-${donation.completedAt.getFullYear()}-${String(donation.id).padStart(6, '0')}`,
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

  // B-1. HTML 템플릿 → PDF 렌더링
  async certificatePdf(id: number): Promise<Buffer> {
    const data = await this.certificate(id);
    const html = renderCertificateHtml(data);

    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      // 발급 이력: 서빙 URL 기록 (최초 1회)
      await this.donationRepo.update(
        { id, certificateUrl: IsNull() },
        { certificateUrl: `/api/donations/${id}/certificate.pdf` },
      );
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser?.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }
}
