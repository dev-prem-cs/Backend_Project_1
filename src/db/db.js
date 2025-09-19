import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB= async () => {
    try {
        const CONNECTION_INSTANCE=await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected! Host: ${CONNECTION_INSTANCE.connection.host}    `);
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}
export default connectDB;