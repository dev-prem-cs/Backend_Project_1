import {Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
userRouter.post("/refresh-token",refreshAccessToken)
userRouter.post("/changePassword",verifyJWT,changeCurrentPassword)
userRouter.get("/info",verifyJWT,getCurrentUser)
userRouter.patch("/update",verifyJWT,updateAccountDetails)
userRouter.post("/update-avatar",verifyJWT,upload.single("avatar"),updateUserAvatar)
userRouter.post("/update-coverImage",verifyJWT,upload.single("coverImage"),updateUserCoverImage)     

// pending testing  

userRouter.get("/ch/:username",verifyJWT,getUserChannelProfile)
userRouter.get("/history",verifyJWT,getUserChannelProfile)
