import { PostsModel } from "@models/Posts";
import { IPostRepository, Post } from "types/PostTypes";
import { Query } from "types/RepositoryTypes";

export class PostRepository implements IPostRepository {
  async create(data: Post): Promise<Post> {
    const newPost = new PostsModel(data);
    return await newPost.save();
  }

  async find(query?: Query): Promise<Post[]> {
    return await PostsModel.find(query || {}).exec();
  }

  async findById(id: string): Promise<Post | null> {
    return await PostsModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    return await PostsModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await PostsModel.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
