import asyncHandler from "../utils/asuncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

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

export { registerUser };
