import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { USERS_REPOSITORY } from './interfaces/users.repository.interface';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateUserDto } from './dto/create-user.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAuthUser(
  role: UserRole,
  overrides: Partial<AuthUser> = {},
): AuthUser {
  return {
    userId: `${role.toLowerCase()}-id`,
    email: `${role.toLowerCase()}@test.com`,
    role,
    organizationId: null,
    ...overrides,
  };
}

function makeCreateDto(overrides: Partial<CreateUserDto> = {}): CreateUserDto {
  return {
    email: 'new@test.com',
    password: 'Password123',
    name: 'Test User',
    role: UserRole.USER,
    ...overrides,
  };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUsersRepository = {
  adminCreateUser: jest.fn(),
  createNormalUser: jest.fn(),
  createCorporateUserWithOrg: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById: jest.fn(),
  findByIdWithPassword: jest.fn(),
  findAll: jest.fn(),
  updateProfile: jest.fn(),
  adminUpdate: jest.fn(),
  updatePassword: jest.fn(),
  softDelete: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    describe('ADMIN caller', () => {
      it('creates a USER — resolvedOrgId passed to repo is null', async () => {
        const dto = makeCreateDto({ role: UserRole.USER });
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);
        mockUsersRepository.adminCreateUser.mockResolvedValue({
          id: 'u-1',
          email: dto.email,
          role: UserRole.USER,
          organizationId: null,
        });

        const result = await service.create(dto, caller);

        expect(result.organizationId).toBeNull();
        expect(mockUsersRepository.adminCreateUser).toHaveBeenCalledWith(
          dto,
          expect.any(String),
          null,
        );
      });

      it('creates an ACCOUNT_MANAGER — resolvedOrgId is null', async () => {
        const dto = makeCreateDto({ role: UserRole.ACCOUNT_MANAGER });
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);
        mockUsersRepository.adminCreateUser.mockResolvedValue({ id: 'u-2' });

        await service.create(dto, caller);

        const [, , resolvedOrgId] =
          mockUsersRepository.adminCreateUser.mock.calls[0];
        expect(resolvedOrgId).toBeNull();
      });

      it('attempting to create a DRIVER — throws BadRequestException', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('attempting to create a DRIVER — error message names the correct fix', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          'DRIVER accounts must be created by an Account Manager.',
        );
      });

      it('attempting to create a DRIVER — repo is never called', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          BadRequestException,
        );
        expect(mockUsersRepository.adminCreateUser).not.toHaveBeenCalled();
      });

      it('throws ConflictException when email already exists', async () => {
        const dto = makeCreateDto();
        const caller = makeAuthUser(UserRole.ADMIN);

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue({
          id: 'existing',
        });

        await expect(service.create(dto, caller)).rejects.toThrow(
          ConflictException,
        );
        expect(mockUsersRepository.adminCreateUser).not.toHaveBeenCalled();
      });
    });

    describe('ACCOUNT_MANAGER caller', () => {
      it('creates a DRIVER — organizationId resolved from caller JWT, not from dto', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);
        mockUsersRepository.adminCreateUser.mockResolvedValue({
          id: 'driver-1',
          email: dto.email,
          role: UserRole.DRIVER,
          organizationId: 'org-abc',
        });

        const result = await service.create(dto, caller);

        expect(result.organizationId).toBe('org-abc');
        expect(mockUsersRepository.adminCreateUser).toHaveBeenCalledWith(
          dto,
          expect.any(String),
          'org-abc',
        );
      });

      it('creates a DRIVER — caller org is used even if dto had a different org somehow', async () => {
        // organizationId is not on CreateUserDto by design, but this test
        // confirms the repo receives the caller's org regardless
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);
        mockUsersRepository.adminCreateUser.mockResolvedValue({ id: 'driver-1' });

        await service.create(dto, caller);

        const [, , resolvedOrgId] =
          mockUsersRepository.adminCreateUser.mock.calls[0];
        expect(resolvedOrgId).toBe('org-abc');
      });

      it('attempting to create a USER role — throws BadRequestException', async () => {
        const dto = makeCreateDto({ role: UserRole.USER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('attempting to create an ACCOUNT_MANAGER role — throws BadRequestException', async () => {
        const dto = makeCreateDto({ role: UserRole.ACCOUNT_MANAGER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('attempting to create any non-DRIVER role — error message is explicit', async () => {
        const dto = makeCreateDto({ role: UserRole.USER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          'Account Managers can only create DRIVER accounts.',
        );
      });

      it('attempting to create any non-DRIVER role — repo is never called', async () => {
        const dto = makeCreateDto({ role: UserRole.USER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          BadRequestException,
        );
        expect(mockUsersRepository.adminCreateUser).not.toHaveBeenCalled();
      });

      it('has no organizationId in JWT (malformed token) — throws ForbiddenException', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: null, // malformed — no org despite being ACCOUNT_MANAGER
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('has no organizationId in JWT — repo is never called', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: null,
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue(null);

        await expect(service.create(dto, caller)).rejects.toThrow(
          ForbiddenException,
        );
        expect(mockUsersRepository.adminCreateUser).not.toHaveBeenCalled();
      });

      it('throws ConflictException when email already exists — before org resolution', async () => {
        const dto = makeCreateDto({ role: UserRole.DRIVER });
        const caller = makeAuthUser(UserRole.ACCOUNT_MANAGER, {
          organizationId: 'org-abc',
        });

        mockUsersRepository.findByEmailWithPassword.mockResolvedValue({
          id: 'existing',
        });

        await expect(service.create(dto, caller)).rejects.toThrow(
          ConflictException,
        );
        expect(mockUsersRepository.adminCreateUser).not.toHaveBeenCalled();
      });
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the user when found', async () => {
      mockUsersRepository.findById.mockResolvedValue({
        id: 'u-1',
        email: 'x@x.com',
      });

      const result = await service.findOne('u-1');

      expect(result).toEqual({ id: 'u-1', email: 'x@x.com' });
    });

    it('returns null when user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      const result = await service.findOne('ghost');

      expect(result).toBeNull();
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all users when no role filter is given', async () => {
      mockUsersRepository.findAll.mockResolvedValue([{ id: 'u-1' }]);

      const result = await service.findAll();

      expect(mockUsersRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('passes role filter to repository', async () => {
      mockUsersRepository.findAll.mockResolvedValue([]);

      await service.findAll(UserRole.DRIVER);

      expect(mockUsersRepository.findAll).toHaveBeenCalledWith(UserRole.DRIVER);
    });
  });

  // ─── changePassword ───────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      mockUsersRepository.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        service.changePassword('ghost', {
          currentPassword: 'old',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      // bcrypt.compare will return false for a plaintext vs plaintext comparison
      // so we store a bcrypt hash of a different password
      const bcrypt = await import('bcrypt');
      const wrongHash = await bcrypt.hash('different-password', 10);

      mockUsersRepository.findByIdWithPassword.mockResolvedValue({
        id: 'u-1',
        password: wrongHash,
      });

      await expect(
        service.changePassword('u-1', {
          currentPassword: 'wrong-password',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('updates password when current password is correct', async () => {
      const bcrypt = await import('bcrypt');
      const correctHash = await bcrypt.hash('correct-password', 10);

      mockUsersRepository.findByIdWithPassword.mockResolvedValue({
        id: 'u-1',
        password: correctHash,
      });
      mockUsersRepository.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword('u-1', {
        currentPassword: 'correct-password',
        newPassword: 'newpass123',
      });

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(mockUsersRepository.updatePassword).toHaveBeenCalledWith(
        'u-1',
        expect.any(String), // new bcrypt hash
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('delegates soft delete to repository', async () => {
      mockUsersRepository.softDelete.mockResolvedValue(undefined);

      await service.remove('u-1');

      expect(mockUsersRepository.softDelete).toHaveBeenCalledWith('u-1');
    });
  });
});
