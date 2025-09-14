import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const CommentSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  content: {
    type: Schema.Types.ObjectId,
    ref: "Video",
  },  owner: {
    type: Schema.Types.ObjectId,
    ref :"User",},
}
,{
    timestamps:true,
});

CommentSchema.plugin(mongooseAggregatePaginate)
const Comment = mongoose.model("Comment", CommentSchema);
