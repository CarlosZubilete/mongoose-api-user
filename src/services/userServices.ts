import { IUserRepository, IUserService, User } from "types/UserTypes";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: User): Promise<User> {
    return this.userRepository.create(data);
  }

  async findUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  // async getUser(id: string): Promise<User | null> {
  //   return this.userRepository.findById(id);
  // }

  // async updateUser(id: string, data: Partial<User>): Promise<User> {
  //   return this.userRepository.update(id, data);
  // }

  // async deleteUser(id: string): Promise<boolean> {
  //   return this.userRepository.delete(id);
  // }
}
