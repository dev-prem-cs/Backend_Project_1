import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();

const app=express();

app.use(cookieParser());
app.use(express.json({limit:"16kb"}))
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.json());
app.use(express.static("public"))

export default app;

