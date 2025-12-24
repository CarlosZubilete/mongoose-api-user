import { PostRepository } from "@repositories/postRepositories";
import { PostService } from "@services/postServices";
import { IPostRepository, IPostService, Post } from "types/PostTypes";
import { Request, Response } from "express";

const postRepository: IPostRepository = new PostRepository();
const postService: IPostService = new PostService(postRepository);

export const findPosts = async (req: Request, res: Response) => {
  console.log("Fetching all posts...", req.currentUser);
  try {
    const posts: Post[] = await postService.findPosts();
    if (posts.length === 0)
      return res.status(404).json({ message: "No posts found" });

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error fetching posts: >> ", error);
    res.status(500).json(error);
  }
};

export const findPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post: Post | null = await postService.findPostById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    console.log("Error fetching post by id: >> ", error);
    res.status(500).json(error);
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const newRole: Post = req.body;
    const result = await postService.createPost(newRole);
    res.status(201).json(result);
  } catch (error) {
    console.log("Error creating post: >> ", error);
    res.status(400).json(error);
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<Post> = req.body;
    const updatedPost: Post | null = await postService.updatePost(id, data);
    if (!updatedPost)
      return res.status(404).json({ message: "Post not found" });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log("Error updating post: >> ", error);
    res.status(500).json(error);
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted: boolean = await postService.deletePost(id);
    if (!deleted) return res.status(404).json({ message: "Post not found" });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error deleting post: >> ", error);
    res.status(500).json(error);
  }
};
