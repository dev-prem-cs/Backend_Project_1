import {Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
export const userRouter=Router();
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



userRouter.post("/register",
    upload.fields([{
        name:"avatar",maxCount:1
    },{
        name:"coverImage",maxCount:1
    }]),
    registerUser);

userRouter.post("/login",loginUser);

//protected routes

userRouter.post("/logout",verifyJWT,logoutUser)