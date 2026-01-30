import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './interfaces/orders.repository.interface';
import { CarsService } from '../cars/cars.service';
import { UserRole } from '@prisma/client';

const mockOrdersRepository = {
  findAll: jest.fn(),
  createTransactional: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
};

const mockCarsService = {
  findOne: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: typeof mockOrdersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: ORDERS_REPOSITORY,
          useValue: mockOrdersRepository,
        },
        {
          provide: CarsService,
          useValue: mockCarsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get(ORDERS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty orders list', async () => {
    repository.findAll.mockResolvedValue([]);

    const result = await service.findAll(
      { skip: 0, take: 10 },
      'user-id',
      UserRole.USER,
    );

    expect(result).toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(
      { skip: 0, take: 10 },
      'user-id',
    );
  });
});
