import { Query } from "types/RepositoryTypes";
import { IRoleService, Role, IRoleRepository } from "types/RoleTypes";

export class RoleService implements IRoleService {
  private rolesRepository: IRoleRepository;

  constructor(rolesRepository: IRoleRepository) {
    this.rolesRepository = rolesRepository;
  }

  async createRole(data: Role): Promise<Role> {
    return this.rolesRepository.create(data);
  }

  async findRoles(query?: Query): Promise<Role[]> {
    return this.rolesRepository.find(query);
  }

  async findRoleById(id: string): Promise<Role | null> {
    return this.rolesRepository.findById(id);
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    return this.rolesRepository.update(id, data);
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.rolesRepository.delete(id);
  }
}
