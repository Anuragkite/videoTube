import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer", "");

  if (!token) {
    throw new ApiError(401, "unautorized!");
  }
  try {
    const decodedToken = jwt.verify(token, process.ENV.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    ); // grabbing the user from db

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }
    user = req.user;
    next();
  } catch(error) {

    throw new ApiError(401,error?.message ||"Invalide access Token")


  }
});
