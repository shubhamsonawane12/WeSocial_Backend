import mongoose from "mongoose";

const  userpostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, 
   
    postText: {
        type: String,
        trim: true
    },
    postImage: [{
        type: String,
        trim: true
    }],
    postVideo: {
        type: String,
        trim: true
   
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
}, { timestamps: true });

export const Post = mongoose.model("Post", userpostSchema);
 