import { IPostRepository, IPostService, Post } from "types/PostTypes";
import { Query } from "types/RepositoryTypes";

export class PostService implements IPostService {
  private postsRepository: IPostRepository;

  constructor(postsRepository: IPostRepository) {
    this.postsRepository = postsRepository;
  }

  async createPost(data: Post): Promise<Post> {
    return this.postsRepository.create(data);
  }

  async findPosts(query?: Query): Promise<Post[]> {
    return this.postsRepository.find(query);
  }

  async findPostById(id: string): Promise<Post | null> {
    return this.postsRepository.findById(id);
  }

  async updatePost(id: string, data: Partial<Post>): Promise<Post | null> {
    return this.postsRepository.update(id, data);
  }

  async deletePost(id: string): Promise<boolean> {
    return this.postsRepository.delete(id);
  }
}
