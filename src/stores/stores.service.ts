import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
  ) {}

  create(dto: CreateStoreDto) {
    return this.storeRepo.save(this.storeRepo.create(dto));
  }

  findAll() {
    return this.storeRepo.find();
  }

  async findOne(id: number) {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('가게를 찾을 수 없습니다.');
    return store;
  }
}
