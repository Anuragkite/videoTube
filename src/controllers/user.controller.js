import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.error("user creation failed ",error);
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
export { registerUser };
