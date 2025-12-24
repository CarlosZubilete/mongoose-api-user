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
import { verifyToken } from "middlewares/auth";

const router: Router = Router();

export default () => {
  router.get("/healthy", (_, res: Response) => {
    res.send("Api is healthy");
  });
  // * auth routes
  router.post("/auth/register", registerUser);
  router.post("/auth/login", loginUser);

  // * user routes
  router.get("/users", verifyToken, findUsers);
  router.get("/users/:id", verifyToken, findUserById);
  router.post("/users", verifyToken, createUser);
  router.put("/users/:id", verifyToken, updateUser);
  router.delete("/users/:id", verifyToken, deleteUser);

  // * role routes
  router.get("/roles", verifyToken, findRoles);
  router.get("/roles/:id", verifyToken, findRoleById);
  router.post("/roles", verifyToken, createRole);
  router.put("/roles/:id", verifyToken, updateRole);
  router.delete("/roles/:id", verifyToken, deleteRole);
  // * post routes
  router.get("/posts", findPosts);
  router.get("/posts/:id", findPostById);
  router.post("/posts", verifyToken, createPost);
  router.put("/posts/:id", updatePost);
  router.delete("/posts/:id", deletePost);

  return router;
};
