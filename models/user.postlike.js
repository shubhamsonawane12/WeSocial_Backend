import mongoose from 'mongoose';
    
const postLikeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  likedAt: { type: Date, default: Date.now },
});

export const PostLike = mongoose.model('PostLike', postLikeSchema);


   