// playlists [icon: library) {
// id string pk
// owner Objectld users
// videos Objectld[J videos
// nanoring
// description string
// createdAt Date
// updatedAt Date
import mongoose, { Schema } from "mongoose";


const PlaylistSchema = new Schema({
    name:{type:string,
        required:true
    },
    description:{
        type:String,
        required:true 
    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video",
    }],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestaps:true 
})
export const Video = mongoose.model("video", videoSchema);
