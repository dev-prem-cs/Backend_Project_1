import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import JWT from "jsonwebtoken";

const tokenGenerator = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { fullName, username, email, password } = req.body;

  // validate user data
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }
  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // 5. Upload to Cloudinary

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath, "avatars");
  const coverImage = coverImageLocalPath
    ? await uploadToCloudinary(coverImageLocalPath, "covers")
    : undefined;

  if (!avatar?.secure_url) {
    throw new ApiError(500, "Avatar upload failed, please try again");
  }
  // hash password -- done in pre save hook

  // create user object and save in db
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "", // Assign URL or an empty string
  });

  // generate jwt token
  const { accessToken, refreshToken } = await tokenGenerator(user._id);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  // 8. Construct response object without sensitive data
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send response
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(201, createdUser, "User registered successfully"));
});

// login controller
const loginUser = asyncHandler(async (req, res) => {
  //1. req body-> data
  const { username, email, password } = req.body;
  //2. validate data
  if (!(username || email) || !password) {
    throw new ApiError(400, "Username or email and password are required");
  }
  //3. username or email
  //4. find the user
  const user = await User.findOne({
    $or: [
      { username: username?.toLowerCase() },
      { email: email?.toLowerCase() },
    ],
  });
  if (!user) {
    throw new ApiError(404, "User not found, please register");
  }

  //check password using method in user model
  const isAuthenticated = await user.isPasswordCorrect(password);

  if (!isAuthenticated) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //access and refreshtoken

  const { accessToken, refreshToken } = await tokenGenerator(user._id);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  //send cookies
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(200, loggedInUser, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new apiResponse(200, "User logged out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefToken = req.cookies?.refreshToken || req.body?.refreshToken;
  // console.log(incommingRefToken)
  if (!incommingRefToken) {
    throw new ApiError(401, "unauthorised request");
  }

  const decodedRefToken = JWT.verify(
    incommingRefToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedRefToken?.id);

  if (!user) {
    throw new ApiError(401, "invalid refresh token");
  }

  if (user?.refreshToken !== incommingRefToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, newrefreshToken } = await tokenGenerator(user._id);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          accessToken,
          refreshToken: newrefreshToken,
        },
        "access token refreshed"
      )
    );
});

const changeCurrentPassword=asyncHandler(async (req,res) => {
        const {oldPassword,newPassword}=req.body;
        if (!oldPassword || !newPassword){
          throw new ApiError(
            400,
            "all fields are required"
          )
        }   
        //validate old password
        const user=await User.findById(req.user.id).select("+password");
        const isPassMatch=await user.isPasswordCorrect(oldPassword);
        if (!isPassMatch){
          throw new ApiError(
            401,
            "incorrect old password"
          )
        }
        //store new password in db
        user.password=newPassword;
        await user.save({
          validateBeforeSave:false
        })
        return res
        .status(200)
        .json(
          new apiResponse(200,
            "","password updated successfully"
          )
        )
})


const getCurrentUser=asyncHandler(async (req,res) => {
        return res.
        status(200).
        json(new apiResponse(200,
          {
            user:req.user
          },
          "user info fetched "
        ))
})

const updateAccountDetails=asyncHandler(async (req,res) => {
          const {fullName,email}=req.body;
          if (!fullName||!email){
            throw new ApiError(400,"all fields are required")
          }

          const user=User.findByIdAndUpdate(req.user?.id,
            {
                $set:{
                  fullName,
                  email
                }
            },{
              new:true
            }
          ).select("-password")
          return res.
          status(200).
          json(new apiResponse(200,
            user,
            "user info updated successfully"
          ))
})


export { registerUser, loginUser, logoutUser, refreshAccessToken ,changeCurrentPassword ,getCurrentUser, updateAccountDetails};
