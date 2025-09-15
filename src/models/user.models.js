import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  fullname: {
    type: String,
    required: true,

    trim: true,
    index: true,
  },
  avatar:{
    type:String
  },
   coverImage:{
    type:String,
     
  },
  watchHistory: [
    {

        type: Schema.Types.ObjectId,
        ref:"Video"
    }
  ],
  password:{
    type:String,
    required:[true,"password is mandatory"]
  },
  refreshToken:{
    type:String
  }
  
},
{
    timestamps:true
}

);


// check the password is modified or not using bcrypt funtion 
// don't use async and next togther it will cause error i have removed it 
userSchema.pre("save", async function(){
  if(!this.isModified("password")) return ;
  this.password = await bcrypt.hash(this.password,10)
})


// compare the is same or not
userSchema.methods.isPasswordCorrect = async function (password){
  return await  bcrypt.compare(password,this.password)
}


userSchema.methods.generateRefreshToken =  function (){
// short lived access Token  
 return jwt.sign({
  _id : this._id,
  
},
process.env.REFRESH_TOKEN_SECRET,
{expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
)

}


userSchema.methods.generateAccessToken = function (){
// short lived access Token  
 return jwt.sign({
  _id : this._id,
  username:this.username,
  email:this.email,
  fullname:this.fullname,
},
process.env.ACCESS_TOKEN_SECRET,
{expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
)

}
export const User = mongoose.model("user", userSchema); //as we export this db it will give me all the funtionality of the mongodb with this User variable
