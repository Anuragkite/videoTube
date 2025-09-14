import mongoose, { Schema } from "mongoose";

const SuscriberSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is suscribing
        ref:"User"
    },
    channel:{
       type:Schema.Types.ObjectId,//one to whom i.e. suscriber is suscribing
        ref:"User"
    }
}
,{timestamps:true})

const Comment = mongoose.model("Comment", SuscriberSchema);