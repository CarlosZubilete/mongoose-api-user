import { IRepository, Query } from "./RepositoryTypes";

export interface Post {
  title: string;
  description?: string;
  content?: string;
  featuredImageUrl?: string;
  author: string;
}

export interface IPostRepository extends IRepository<Post> {}

export interface IPostService {
  createPost(data: Post): Promise<Post>;
  findPosts(query?: Query): Promise<Post[]>;
  findPostById(id: string): Promise<Post | null>;
  updatePost(id: string, data: Partial<Post>): Promise<Post | null>;
  deletePost(id: string): Promise<boolean>;
}
