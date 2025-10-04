import {Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
export const userRouter=Router();
import { upload } from "../middlewares/multer.middleware.js";



userRouter.post("/register",
    upload.fields([{
        name:"avatar",maxCount:1
    },{
        name:"coverImage",maxCount:1
    }]),
    registerUser);