import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findbyId(userId);
    // small check for user existance
    if (!user) {
      throw new ApiError(400, "Error in generateaccessandrefreshtoken ", error);
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshTokenToken();
    user.refreshToken = refreshToken; // stored for longer duration
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      400,
      "error in generating the access and refresh token ",
      error
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //ToDo

  // accepting the user data from body
  const { fullname, email, username, password } = req.body;

  //validation
  if (
    [fullname, email, username, password].some((field) => !field?.trim() === "") // here ?. is an optional chaining and if array is null or undefined then i won't throw err and any field satisfy the condn then i will and returns true
  ) {
    throw new ApiError(400, "all fields are  required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // used the mongodb operator or to find user based on anyone of this fields
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User with username or email is already existed !!"
    );
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // const avatarUpload = avatarLocalPath
  //   ? await uploadOnCloudinary(avatarLocalPath)
  //   : null;
  // const coverUpload = coverLocalPath
  //   ? await uploadOnCloudinary(coverLocalPath)
  //   : null;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }

  // uploading the image on the server that is cloudinary cloud media management
  //   const avatar = await uploadOnCloudinary(avatarLocalPath);
  //   coverImageLocalPath = "";
  //   if (coverImageLocalPath) {
  //     throw new ApiError(400, "coverImage file is missing");
  //   }
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //refactioning the avatar code as the prev. ones havenot have good error catching probablity
  let avatar, coverImage;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("uploaded Avatar");
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("uploaded coverImage");
  } catch (error) {
    console.log("Error uploading avatar and coverImage ", error);
    throw new ApiError(500, "failed to upload avatar and coverImage ");
  }

  // let avatar, coverImage;
  // try {
  //   avatar = await uploadOnCloudinary(avatarFile.buffer);
  //   if (coverImageLocalPath) {
  //     coverImage = await uploadOnCloudinary(coverFile.buffer);
  //   }

  // } catch (error) {
  //   console.log(avatar)
  //   console.error("Cloudinary upload failed:", error);
  //   throw new ApiError(500, "Failed to upload images");
  // }
  // console.log({
  //     fullname,
  //     email,
  //     username: username.toLowerCase(),
  //     password,
  //     avatar: avatar?.secure_url,
  //     coverImage: coverImage?.url || null,
  //   });    //workjsa
  try {
    const users = await User.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatar?.secure_url,
      coverImage: coverImage?.secure_url || null,
    });
    // console.log(users);

    const createdUser = await User.findById(users._id).select(
      "-password -refreshToken"
    );

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User created successfully"));
  } catch (error) {
    console.error("user creation failed ", error);
    if (avatar?.public_id) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage?.public_id) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "something went wrong while creating a user and images were deleted "
    );
  }
});

// login route
const loginUser = asyncHandler(async (req, res) => {
  // grabbing data from the body
  const { email, username, password } = req.body;
  //validation
  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], // used the mongodb operator or to find user based on anyone of this fields
  });
  if (!user) {
    new ApiError(404, "user not found in the database ");
  }

  // to check the password is correct or not
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    new ApiError(404, "invalid credentials ");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findbyId(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new ApiError(400, "user not found in the db");
  }
  // creating the options for the sending the information to the user
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedInUser, "user loggedIn successfully")); // the response sended in the obj. format that is for mobile purpose only
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    //TODO:need to comeback to part after middleware part:Done
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true } //return only true
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user loggedout successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // grab tokens

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unable to grab the older refresh token ");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findbyId(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "refresh token Invalid");
    }
    if (user?.refreshAccessToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh tokens arenot matched!");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while refreshing new access token"
    );
  }
});

// only used to generate new access token

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findbyid(req.user?._id);
  const isPasswordValid = user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "old password is incorrect!");
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user details./"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "fullname and email, Both are required");
  }
  const user = await User.findByIdAndUpdate(
    req.User?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "File is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "something went wrong while uploading the avatar");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshtoken");
  res.status(200).json(new ApiResponse(200,user,"avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => { 
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(
      500,
      "something went wrong while while uploading the coverImage"
    );
  }
const user = User.findByIdAndUpdate(
  req.user?._id,{
    $set:{
      coverImage:coverImage.url
    }
  },{new:true}
).select("-password -refreshtoken");
res.status(200).json(new ApiResponse(200,user,"coverImage updated successfully"));


});

export { registerUser, refreshAccessToken, loginUser, logoutUser ,updateUserAvatar,updateUserCoverImage,updateAccountDetails,getCurrentUser,changeCurrentPassword};
