import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import connectDB from "./db/db.js";
import authRoutes from "./routes/users.js";
 
// Load environment variables
dotenv.config({ path: './.env' });    

// Initialize express
const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Connect to MongoDB and start the server
const startServer = async () => {
    try {
        await connectDB();
        mongoose.set('debug', true);
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`);
        });
    } catch (error) {
        console.error("Error starting server: ", error);
        process.exit(1);
    }
};

startServer(); 
 