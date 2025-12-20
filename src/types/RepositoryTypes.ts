export interface IRepository<T = unknown> {
  create(data: T): Promise<T>;
  find(): Promise<T[]>;
}
