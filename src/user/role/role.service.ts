import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}
  async create(createRoleDto: CreateRoleDto) {
    const newRole = await this.roleRepository.save(createRoleDto);
    return newRole;
  }

  async findAll() {
    const roles = await this.roleRepository.find();
    return roles;
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOneBy({
      id: id,
    });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async findOneByName(name: string) {
    const role = await this.roleRepository.findOneBy({
      name: name,
    });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    for (const item in updateRoleDto) {
      role[item] = updateRoleDto[item];
    }
    await role.save();
    return role;
  }

  async remove(id: string) {
    const deleteResponse = await this.roleRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new NotFoundException('Role not found for this ID');
    }
  }
}
