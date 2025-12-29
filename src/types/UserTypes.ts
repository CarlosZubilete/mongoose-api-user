import { Document } from "mongoose";
import { IRepository, Query } from "./RepositoryTypes";
import { Role } from "./RoleTypes";

export interface User extends Document {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  comparePassword(password: string): Promise<boolean>;
  roles?: Role[];
  permissions?: string[];
}

export interface IUserRepository extends IRepository<User> {
  findOne(query: Query): Promise<User | null>;
}

export interface IUserService {
  createUser(data: User): Promise<User>;
  findUsers(query?: Query): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
