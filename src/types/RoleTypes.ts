import { IRepository } from "./RepositoryTypes";

export interface Role {
  name: string;
}

export interface IRoleRepository extends IRepository<Role> {}

export interface IRoleService {
  createRole(data: Role): Promise<Role>;
  findRoles(): Promise<Role[]>;
  findRoleById(id: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
}
