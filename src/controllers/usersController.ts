import { Request, Response } from "express";
import { IUserRepository, IUserService, User } from "types/UserTypes";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const findUsers = async (req: Request, res: Response) => {
  try {
    const users: User[] = await userService.findUsers();
    if (users.length === 0)
      return res.status(404).json({ message: "No users found" });
    res.json(users);
  } catch (error) {
    console.log("Error fetching users: >> ", error);
    res.status(500).json(error);
  }
};

export const findUserById = async (req: Request, res: Response) => {
  try {
    const user: User | null = await userService.findUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log("Error fetching user by ID: >> ", error);
    res.status(500).json(error);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user: User = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.log("Error creating user: >> ", error);
    res.status(400).json(error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user: User | null = await userService.updateUser(
      req.params.id,
      req.body
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log("Error updating user: >> ", error);
    res.status(500).json(error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const success: boolean = await userService.deleteUser(req.params.id);
    if (!success) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user: >> ", error);
    res.status(500).json(error);
  }
};
