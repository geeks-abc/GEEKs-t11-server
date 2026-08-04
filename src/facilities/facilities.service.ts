import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facility.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepo: Repository<Facility>,
  ) {}

  create(dto: CreateFacilityDto) {
    return this.facilityRepo.save(this.facilityRepo.create(dto));
  }

  findAll() {
    return this.facilityRepo.find();
  }

  async findOne(id: number) {
    const facility = await this.facilityRepo.findOne({ where: { id } });
    if (!facility) throw new NotFoundException('시설을 찾을 수 없습니다.');
    return facility;
  }
}
