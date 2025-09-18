import { Router } from "express";
import { registerUser ,
  logoutUser, 
  loginUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateAccountDetails,
  updateUserCoverImage,
  getUserChannelProfile
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"; //
import {verifyJWT}  from "../middlewares/auth.middlewares.js";
// import { verify } from "jsonwebtoken";



const router = Router();

//unSecured Routes: anyone can access and no need to add jwt  

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser)
router.route("refresh-token").post(refreshAccessToken)

// secured routes : processing in the middle is going on that's why it is secured routes  
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").post(verifyJWT,updateUserAvatar)
router.route("/update-coverimage").post(verifyJWT,updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)//here username is passsed as param from URL 

export default router;
