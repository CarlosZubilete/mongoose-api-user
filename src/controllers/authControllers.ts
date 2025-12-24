import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "secrets";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { IUserRepository, IUserService, User } from "types/UserTypes";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email }: User = req.body;
    const userExists: User | null = await userService.findUserByEmail(email);
    if (userExists)
      return res.status(409).json({ message: "Email already in use" });

    const user: User = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.log("Error registering user: >> ", error);
    res.status(500).json(error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    // const { email, password }: { email: string; password: string } = req.body;
    const { email, password }: User = req.body;
    const user: User | null = await userService.findUserByEmail(email);
    if (!user)
      return res.status(400).json({ message: "Invalid user or password" });

    const hashMatch = await user.comparePassword(password);
    if (!hashMatch)
      return res.status(400).json({ message: "Invalid user or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.log("Error logging in user: >> ", error);
    res.status(500).json(error);
  }
};

// todo: implement logout. save jwt in cookie.
