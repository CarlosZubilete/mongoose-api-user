import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRepository } from "@repositories/userRepositories";
import { UserService } from "@services/userServices";
import { JWT_SECRET } from "secrets";
import { IUserRepository, IUserService, User } from "types/UserTypes";
import { permissions, Method } from "types/PermissionsTypes";

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

export const getPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { currentUser, method, path } = req;

  // Extract the module from the path
  const currentModule: string = path.replace(/^\/([^\/]+).*/, "$1");

  const { roles } = currentUser;

  // Get the permissions for the method that matches the request method
  const findMethod = permissions.find(
    (pm) => pm.method === Method[method as keyof typeof Method]
  );

  if (!findMethod?.permissions.includes(`${currentModule}_${findMethod.scope}`))
    findMethod?.permissions.push(`${currentModule}_${findMethod.scope}`);

  // const rolesPermissions = roles?.map((role) => role.permissions);
  // const flatPermissions = rolesPermissions?.flat();
  // const mergedPermissions = new Set(flatPermissions);
  const mergedRolesPermissions = [
    ...new Set(roles?.flatMap((x) => x.permissions)),
  ];

  // Verify if the user has permissions.
  // If user has individual permissions, use them; otherwise, use role permissions
  let userPermissions: string[] = [];
  if (currentUser.permissions?.length !== 0)
    userPermissions = currentUser.permissions!;
  else userPermissions = mergedRolesPermissions;

  // Compare the permissions required for the method and the user's permissions
  const permissionGranted = findMethod?.permissions.find((pm) =>
    userPermissions.includes(pm)
  );

  if (!permissionGranted)
    return res.status(403).send("Access denied. No permission.");

  next();
};
