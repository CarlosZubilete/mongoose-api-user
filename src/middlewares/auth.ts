import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { JWT_SECRET } from "secrets";
import { IUserRepository, IUserService, User } from "types/UserTypes";

const userRepository: IUserRepository = new UserRepository();
const userService: IUserService = new UserService(userRepository);

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace(/Bearer\s+/, "") as string;
  // if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const verify = jwt.verify(token, JWT_SECRET) as User;

    const getUser = await userService.findUserById(verify.id);
    if (!getUser) return res.status(400);
    req.currentUser = getUser;

    next();
  } catch (error: any) {
    console.log("Error verifying token: >> ", error);
    return res.status(401).send(error.message);
  }
};
