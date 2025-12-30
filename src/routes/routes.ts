// it will contain all the routes of the application
import { Router, Response } from "express";
import {
  createUser,
  deleteUser,
  findUserById,
  findUsers,
  updateUser,
} from "@controllers/usersController";
import {
  createRole,
  deleteRole,
  findRoleById,
  findRoles,
  updateRole,
} from "@controllers/rolesController";
import { loginUser, registerUser } from "@controllers/authControllers";
import {
  createPost,
  deletePost,
  findPostById,
  findPosts,
  updatePost,
} from "@controllers/postsControllers";
import { getPermissions, verifyToken } from "@middlewares/auth";
import { checkRoles } from "@middlewares/roles";

const router: Router = Router();

export default () => {
  router.get("/healthy", (_, res: Response) => {
    res.send("Api is healthy");
  });
  // * auth routes
  router.post("/auth/register", checkRoles, registerUser);
  router.post("/auth/login", loginUser);

  // * user routes
  router.get("/users", verifyToken, getPermissions, findUsers);
  router.get("/users/:id", verifyToken, getPermissions, findUserById);
  router.post("/users", verifyToken, checkRoles, createUser);
  router.put("/users/:id", verifyToken, getPermissions, updateUser);
  router.delete("/users/:id", verifyToken, getPermissions, deleteUser);
  // * role routes
  router.get("/roles", verifyToken, getPermissions, findRoles);
  router.get("/roles/:id", verifyToken, getPermissions, findRoleById);
  router.post("/roles", verifyToken, getPermissions, createRole);
  router.put("/roles/:id", verifyToken, getPermissions, updateRole);
  router.delete("/roles/:id", verifyToken, getPermissions, deleteRole);
  // * post routes
  router.get("/posts", verifyToken, getPermissions, findPosts); // * public route without verifyToken and getPermissions
  router.get("/posts/:id", verifyToken, getPermissions, findPostById); // * public route verifyToken and getPermissions
  router.post("/posts", verifyToken, getPermissions, createPost);
  router.put("/posts/:id", verifyToken, getPermissions, updatePost);
  router.delete("/posts/:id", verifyToken, getPermissions, deletePost);

  return router;
};
