import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ORDERS_REPOSITORY, useValue: mockOrdersRepository },
        { provide: CarsService, useValue: mockCarsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('filters by userId for USER role', async () => {
      mockOrdersRepository.findAll.mockResolvedValue([]);

      await service.findAll(
        { skip: 0, take: 10 },
        'user-id-123',
        UserRole.USER,
      );

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        'user-id-123',
      );
    });

    it('does not filter by userId for ADMIN role', async () => {
      mockOrdersRepository.findAll.mockResolvedValue([]);

      await service.findAll({ skip: 0, take: 10 }, 'admin-id', UserRole.ADMIN);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        undefined,
      );
    });

    it('does not filter by userId for ACCOUNT_MANAGER role', async () => {
      mockOrdersRepository.findAll.mockResolvedValue([]);

      await service.findAll(
        { skip: 0, take: 10 },
        'mgr-id',
        UserRole.ACCOUNT_MANAGER,
      );

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        undefined,
      );
    });
  });

  describe('create', () => {
    const userContext = { userId: 'user-1', role: UserRole.USER };
    const dto = { carId: 'car-1', items: [{ partId: 'part-1', quantity: 1 }] };

    it('verifies car ownership then delegates to repository', async () => {
      mockCarsService.findOne.mockResolvedValue({ id: 'car-1' });
      mockOrdersRepository.createTransactional.mockResolvedValue({
        id: 'order-1',
      });

      const result = await service.create(userContext, dto);

      expect(mockCarsService.findOne).toHaveBeenCalledWith(
        'car-1',
        userContext,
      );
      expect(mockOrdersRepository.createTransactional).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toEqual({ id: 'order-1' });
    });

    it('throws and does not create order when car access is denied', async () => {
      mockCarsService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(service.create(userContext, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockOrdersRepository.createTransactional).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the order when the owner requests it', async () => {
      mockOrdersRepository.findById.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
      });

      const result = await service.findOne('order-1', 'user-1', UserRole.USER);

      expect(mockOrdersRepository.findById).toHaveBeenCalledWith('order-1');
      expect(result).toEqual({ id: 'order-1', userId: 'user-1' });
    });

    it('throws ForbiddenException when a different user requests it', async () => {
      mockOrdersRepository.findById.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
      });

      await expect(
        service.findOne('order-1', 'other-user', UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows ADMIN to fetch any order', async () => {
      mockOrdersRepository.findById.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
      });

      const result = await service.findOne(
        'order-1',
        'admin-id',
        UserRole.ADMIN,
      );

      expect(result).toEqual({ id: 'order-1', userId: 'user-1' });
    });

    it('throws NotFoundException when order does not exist', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(
        service.findOne('ghost-id', 'user-1', UserRole.USER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
