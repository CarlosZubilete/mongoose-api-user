import { Request, Response, NextFunction } from "express";
import { RoleService } from "@services/roleServices";
import { RoleRepository } from "@repositories/roleRepositories";
import { IRoleRepository, IRoleService, Role } from "types/RoleTypes";

const roleRepository: IRoleRepository = new RoleRepository();
const roleService: IRoleService = new RoleService(roleRepository);

export const checkRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // check if roles are provided in the request body
  const roles: string[] = req.body && req.body?.roles ? req.body.roles : [];
  const role = Array.isArray(roles) && roles.length !== 0 ? roles : ["user"];
  // console.log("Roles to be assigned:", role);
  try {
    const findRoles: Role[] = await roleService.findRoles({
      name: { $in: role },
    });

    if (findRoles.length === 0) return res.status(404).send("No roles found");

    // console.log("Found roles:", findRoles);
    req.body.roles = findRoles.map((r) => r._id);
    // console.log("Assigned role IDs to request body:", req.body.roles);

    next();
  } catch (error) {
    console.log("Error in role checking middleware:", error);
    return res.status(500).json(error);
  }
};
