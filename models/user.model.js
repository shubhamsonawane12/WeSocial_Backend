import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    Firstname: {
        type: String,
        trim: true,
        index: true
    },
    Lastname: {
        type: String,
        trim: true,
        index: true
    },
    Username: {
        type: String,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    profileImage: {
        type: String
    },
    coverImage: {
        type: String
    }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
