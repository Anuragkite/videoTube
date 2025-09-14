import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  likes: { type: Schema.Types.ObjectId, ref: "Video" },
  Comments: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
  },
  Tweet:{
    type:Schema.Types.ObjectId,
    ref:"Tweet"
  },
  likeBy:{
    type:Schema.Types.ObjectId,
    ref:"User"
  }
},
{
    timestamps:true
}
);

const Likes = mongoose.model("Likes", likeSchema);
