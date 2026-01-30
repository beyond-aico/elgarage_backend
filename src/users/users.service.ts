import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USERS_REPOSITORY } from './interfaces/users.repository.interface';
import type { IUsersRepository } from './interfaces/users.repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(role?: UserRole) {
    return this.usersRepository.findAll(role);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.usersRepository.delete(id);
  }
}
