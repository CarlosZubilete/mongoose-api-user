import { IRepository } from "./RepositoryTypes";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
}

export interface IUserRepository extends IRepository<User> {}

export interface IUserService {
  createUser(data: User): Promise<User>;
  findUsers(): Promise<User[]>;
  findUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
