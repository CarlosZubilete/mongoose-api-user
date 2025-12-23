import { RoleModel } from "models/Roles";
import { IRoleRepository, Role } from "types/RoleTypes";

export class RoleRepository implements IRoleRepository {
  async create(data: Role): Promise<Role> {
    const newRole = new RoleModel(data);
    return await newRole.save();
  }

  async find(): Promise<Role[]> {
    return await RoleModel.find().exec();
  }

  async findById(id: string): Promise<Role | null> {
    return await RoleModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Role>): Promise<Role | null> {
    return await RoleModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await RoleModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
