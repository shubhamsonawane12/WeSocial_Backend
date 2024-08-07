import express from "express"
import bcrypt from "bcrypt";
import multer from 'multer';
import fs from "fs";
import path from "path";
import { User  } from '../models/user.model.js';
import { PostLike } from '../models/user.postlike.js';
// import { User  } from '../models/user.model.js';
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/auth.middleware.js";
// import {v2 as cloudinary} from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Post } from "../models/user.post.js";
import { Follow } from '../models/user.follow.js';
const router = express.Router();
dotenv.config();






// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }); 
router.post('/register',async (req, res)=>{
    try{
        const {Firstname , Lastname, Username , password,email,}=req.body;
        const existingUser = await User.findOne({email,Username});

        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newUser = new User({
            Firstname,
            Lastname, 
            Username,
            email,
            password:hashedPassword, 

        });
        await newUser.save();
        const token = jwt.sign(
            {userId:newUser._id},
            process.env.JWT_SECRET,
            {expiresIn:'1h'}

        );
        res.status(200).json({token ,message:"User created succesfully"});

    }catch(error){
        console.log(error);
        res.status(500).json({message:"Error in creating user"});
    }
});


router.post('/login', async (req , res)=>{
    try{
        const {email, password}=req.body;

        const user = await User.findOne ({email});
        if (!user){
            return res.status(400).json({message:"invalid credentitals "});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch){
            return res.status(400).json({message:"invalid credentials"});
        }
        const token  = jwt.sign(
            { userId:user._id},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );
        res.status(200).json({token});

    }catch (error){
        res.status(500).json({message: "Server error"});
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // You can access the authenticated user's ID from req.userId (assuming your authMiddleware sets this)
    const userId = req.userId;
    
    console.log("user_id from auth:",userId);
    // Fetch user details from the database
    const user = await User.findById(userId);
     const userPosts = await Post.find({ user: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user details to the frontend
    res.status(200).json({
      userId:userId,
      FirstName: user.Firstname,
      LastName: user.Lastname,
      Username: user.Username,
      email: user.email,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
       posts: userPosts,
       
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upload', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary using cloudinary.v2.uploader.upload
    const result = await cloudinary.uploader.upload(req.file.path);
 fs.unlinkSync(req.file.path);

 const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: result.secure_url },
      { new: true }, // To return the updated document
      console.log('url saved in database ')
    );
 
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's profile image URL in the database
    await User.findByIdAndUpdate(req.userId, { profileImage: result.secure_url });

    // Respond with success
    res.status(200).json({ message: 'Image uploaded successfully', url: result.secure_url });
 
  } catch (error) {
    console.error('Error uploading image: ', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});
 router.post('/coverupload', authMiddleware, upload.single('coverImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary using cloudinary.v2.uploader.upload
    const result = await cloudinary.uploader.upload(req.file.path);
 fs.unlinkSync(req.file.path);

 const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { coverImage: result.secure_url },
      { new: true }, // To return the updated document
      console.log('url saved in database ')
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's profile image URL in the database
    await User.findByIdAndUpdate(req.userId, { coverImage: result.secure_url });

    // Respond with success
    res.status(200).json({ message: 'Image uploaded successfully', url: result.secure_url });

  } catch (error) {
    console.error('Error uploading image: ', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

router.post('/postImage', authMiddleware, upload.single('postImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'postImage not received from client' });
    }

    // Upload to Cloudinary using cloudinary.v2.uploader.upload
    const result = await cloudinary.uploader.upload(req.file.path);
    fs.unlinkSync(req.file.path);

    const newPost = new Post({
      user: req.userId,
      postImage: result.secure_url,
      postText: req.body.postText,
    });

    await newPost.save();

    res.status(200).json({ message: 'postImage uploaded successfully', url: result.secure_url });
  } catch (error) {
    console.error('Error uploading postImage: ', error);
    res.status(500).json({ message: 'Error uploading postImage' });
  }
}); 

router.post('/postVideo', authMiddleware, upload.single('postVideo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'postVideo not received from client' });
    }

    // Upload to Cloudinary using cloudinary.v2.uploader.upload
    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: "video" });
    fs.unlinkSync(req.file.path);

    const newPost = new Post({
      user: req.userId,
      postVideo: result.secure_url,
      postText: req.body.postText,
    });

    await newPost.save();

    res.status(200).json({ message: 'postVideo uploaded successfully', url: result.secure_url });
  } catch (error) {
    console.error('Error uploading postVideo: ', error);
    res.status(500).json({ message: 'Error uploading postVideo' });
  }
});
router.post('/likePost', async (req, res) => {
  try {
    const { postId, userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = await PostLike.findOne({ postId, userId });

    if (existingLike) {
      await PostLike.deleteOne({ postId, userId });
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      const newLike = new PostLike({ postId, userId });
      await newLike.save();
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ message: 'Post liked/unliked successfully' });
  } catch (error) {
    console.error(error); // Log the error to the server console
    res.status(500).json({ message: 'Internal server error' });
  }
}); 

router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const regex = new RegExp(searchQuery, 'i'); // Case-insensitive regex

        const users = await User.find({
            Username: regex
        }).select('Username  Firstname Lastname userId  profileImage');

        res.json(users); // Send matched users
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/Searchedprofile', async (req, res) => {
    try {
        const userId = req.headers['user-id']; // Extract user ID from headers
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await User.findById(userId).select('-password'); // Exclude the password field
        const userPosts = await Post.find({ user: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        } 

        res.status(200).json({
            userId: userId,
            FirstName: user.Firstname,
            LastName: user.Lastname,
            Username: user.Username,
            profileImage: user.profileImage,
            coverImage: user.coverImage,
            posts: userPosts,
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/follow', async (req, res) => {
    const { userId, followId } = req.body;

    try {
        const follow = new Follow({ follower: userId, following: followId });
        await follow.save();

        res.status(200).json({ message: 'Followed successfully' });
    } catch (err) {
        console.error('Error following user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/unfollow', async (req, res) => {
    const { userId, followId } = req.body;

    try {
        await Follow.findOneAndDelete({ follower: userId, following: followId });

        res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (err) {
        console.error('Error unfollowing user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/isFollowing', async (req, res) => {
    const { userId, followId } = req.query;

    try {
        const follow = await Follow.findOne({ follower: userId, following: followId });

        // If follow exists, respond with true; otherwise, respond with false
        const isFollowing = !!follow; // Convert follow object to boolean

        res.status(200).json({ isFollowing });
    } catch (err) {
        console.error('Error checking follow status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/followedPosts', async (req, res) => {
  try {
    const userId = req.query.userId; // Retrieve userId from query parameters
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const followedAccounts = await Follow.find({ follower: userId }).select('following');
    const followingIds = followedAccounts.map(follow => follow.following);

    const posts = await Post.find({ user: { $in: followingIds } }).populate('user').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/likedPosts', async (req, res) => {
  try {
    const userId = req.user?._id; // Use optional chaining to handle undefined
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is missing in request' });
    }

    // Fetch liked posts
    const likedPosts = await PostLike.find({ userId }).populate('postId');
    
    if (!likedPosts.length) {
      return res.status(404).json({ error: 'No liked posts found' });
    }
    
    console.log('Liked posts:', likedPosts); // Log this
    res.json(likedPosts.map(like => like.postId));
  } catch (error) {
    console.error('Error fetching liked posts:', error); // Improved error logging
    res.status(500).json({ error: error.message });
  }
});
router.post('/send', async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id; // Assuming user info is in req.user

    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId',  async (req, res) => {
  try {
    const userId = req.params.userId;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


