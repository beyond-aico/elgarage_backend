import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './interfaces/orders.repository.interface';
import { CarsService } from '../cars/cars.service';
import { StockJobs } from '../inventory/stock.jobs';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(role: UserRole, overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    userId: `${role.toLowerCase()}-id`,
    email: `${role.toLowerCase()}@test.com`,
    role,
    organizationId: null,
    ...overrides,
  };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockOrdersRepository = {
  findAll: jest.fn(),
  findAllByOrganization: jest.fn(),
  createTransactional: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  updateStatusAtomically: jest.fn(),
  reverseStockForOrder: jest.fn(),
};

const mockCarsService = {
  findOne: jest.fn(),
};

const mockStockJobs = {
  checkStock: jest.fn().mockResolvedValue(undefined),
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ORDERS_REPOSITORY, useValue: mockOrdersRepository },
        { provide: CarsService, useValue: mockCarsService },
        { provide: StockJobs, useValue: mockStockJobs },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('passes no userId filter for ADMIN — sees all orders', async () => {
      mockOrdersRepository.findAll.mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 });
      const admin = makeUser(UserRole.ADMIN);

      await service.findAll({ skip: 0, take: 10 }, admin.userId, UserRole.ADMIN, admin);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        undefined,
      );
      expect(mockOrdersRepository.findAllByOrganization).not.toHaveBeenCalled();
    });

    it('scopes by organizationId for ACCOUNT_MANAGER with an org', async () => {
      mockOrdersRepository.findAllByOrganization.mockResolvedValue({
        data: [], total: 0, skip: 0, take: 10,
      });
      const manager = makeUser(UserRole.ACCOUNT_MANAGER, { organizationId: 'org-1' });

      await service.findAll({ skip: 0, take: 10 }, manager.userId, UserRole.ACCOUNT_MANAGER, manager);

      expect(mockOrdersRepository.findAllByOrganization).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        'org-1',
      );
      expect(mockOrdersRepository.findAll).not.toHaveBeenCalled();
    });

    it('falls back to own orders for ACCOUNT_MANAGER without an org', async () => {
      mockOrdersRepository.findAll.mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 });
      const manager = makeUser(UserRole.ACCOUNT_MANAGER);

      await service.findAll({ skip: 0, take: 10 }, manager.userId, UserRole.ACCOUNT_MANAGER, manager);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        manager.userId,
      );
    });

    it('scopes by userId for USER role', async () => {
      mockOrdersRepository.findAll.mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 });
      const user = makeUser(UserRole.USER);

      await service.findAll({ skip: 0, take: 10 }, user.userId, UserRole.USER, user);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        user.userId,
      );
    });

    it('scopes by userId for DRIVER role', async () => {
      mockOrdersRepository.findAll.mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 });
      const driver = makeUser(UserRole.DRIVER);

      await service.findAll({ skip: 0, take: 10 }, driver.userId, UserRole.DRIVER, driver);

      expect(mockOrdersRepository.findAll).toHaveBeenCalledWith(
        { skip: 0, take: 10 },
        driver.userId,
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    const user = makeUser(UserRole.USER, { userId: 'user-1' });
    const dto = { carId: 'car-1', items: [{ partId: 'part-1', quantity: 1 }] };

    it('verifies car ownership then delegates to repository', async () => {
      mockCarsService.findOne.mockResolvedValue({ id: 'car-1' });
      mockOrdersRepository.createTransactional.mockResolvedValue({
        id: 'order-1',
        items: [],
      });

      const result = await service.create(user, dto);

      expect(mockCarsService.findOne).toHaveBeenCalledWith('car-1', user);
      expect(mockOrdersRepository.createTransactional).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toMatchObject({ id: 'order-1' });
    });

    it('does not create order when car access is denied', async () => {
      mockCarsService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(service.create(user, dto)).rejects.toThrow(ForbiddenException);
      expect(mockOrdersRepository.createTransactional).not.toHaveBeenCalled();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the order for the owner', async () => {
      mockOrdersRepository.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

      const result = await service.findOne('order-1', 'user-1', UserRole.USER);

      expect(result).toEqual({ id: 'order-1', userId: 'user-1' });
    });

    it('throws ForbiddenException when a different user requests it', async () => {
      mockOrdersRepository.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

      await expect(
        service.findOne('order-1', 'other-user', UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows ADMIN to fetch any order', async () => {
      mockOrdersRepository.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

      const result = await service.findOne('order-1', 'admin-id', UserRole.ADMIN);

      expect(result).toEqual({ id: 'order-1', userId: 'user-1' });
    });

    it('allows ACCOUNT_MANAGER to fetch any order', async () => {
      mockOrdersRepository.findById.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

      const result = await service.findOne('order-1', 'mgr-id', UserRole.ACCOUNT_MANAGER);

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
