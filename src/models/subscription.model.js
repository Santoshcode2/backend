import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
       type:Schema.Types.ObjectId,  //one who is subscribing 
       ref:"Users"
    },
    channel:{
       type:Schema.Types.ObjectId,  //one to whom 'subscriber' is subscribing
       ref:"Users"
    }
})



export  const Subscription = mongoose.model("Subscription",subscriptionSchema)