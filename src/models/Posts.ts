import mongoose, { Schema } from "mongoose";
import { Post } from "types/PostTypes";

const PostsSchema: Schema = new Schema<Post>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    content: { type: String },
    featuredImageUrl: { type: String },
    author: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PostsModel = mongoose.model<Post>("Posts", PostsSchema);
