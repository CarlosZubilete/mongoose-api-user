import { Document } from "mongoose";
import { IRepository, Query } from "./RepositoryTypes";

export interface Role extends Document {
  name: string;
  permissions: string[];
}

export interface IRoleRepository extends IRepository<Role> {}

export interface IRoleService {
  createRole(data: Role): Promise<Role>;
  findRoles(query?: Query): Promise<Role[]>;
  findRoleById(id: string): Promise<Role | null>;
  updateRole(id: string, data: Partial<Role>): Promise<Role | null>;
  deleteRole(id: string): Promise<boolean>;
}
