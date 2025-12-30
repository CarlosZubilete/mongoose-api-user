import { Request, Response } from "express";
import { IRoleRepository, IRoleService, Role } from "types/RoleTypes";
import { RoleRepository } from "@repositories/roleRepositories";
import { RoleService } from "@services/roleServices";

const roleRepository: IRoleRepository = new RoleRepository();
const roleService: IRoleService = new RoleService(roleRepository);

export const findRoles = async (req: Request, res: Response) => {
  try {
    const roles: Role[] = await roleService.findRoles();
    if (roles.length === 0)
      return res.status(404).json({ message: "No roles found" });
    res.json(roles);
  } catch (error) {
    console.log("Error fetching roles: >> ", error);
    res.status(500).json(error);
  }
};

export const findRoleById = async (req: Request, res: Response) => {
  try {
    const role: Role | null = await roleService.findRoleById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (error) {
    console.log("Error fetching role by ID: >> ", error);
    res.status(500).json(error);
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const role: Role = await roleService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    console.log("Error creating role: >> ", error);
    res.status(400).json(error);
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const role: Role | null = await roleService.updateRole(
      req.params.id,
      req.body
    );
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (error) {
    console.log("Error updating role: >> ", error);
    res.status(500).json(error);
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const success: boolean = await roleService.deleteRole(req.params.id);
    if (!success) return res.status(404).json({ message: "Role not found" });
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.log("Error deleting role: >> ", error);
    res.status(500).json(error);
  }
};
