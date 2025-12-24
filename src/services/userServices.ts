import { Query } from "types/RepositoryTypes";
import { IUserRepository, IUserService, User } from "types/UserTypes";

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: User): Promise<User> {
    return this.userRepository.create(data);
  }

  async findUsers(query?: Query): Promise<User[]> {
    return this.userRepository.find(query);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
