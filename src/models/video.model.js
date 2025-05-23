import mongoose, {Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema= new Schema(
    {
       videoFile:{
        type:String ,//cloudnary url
        require:true
       },
       thumbnail:{
        type:String ,//cloudnary url
        require:true
       },
       title:{
        type:String ,
        require:true
       },
       description:{
        type:String ,//cloudnary url
        require:true
       },
       duration:{
        type:Number ,//cloudnary url
        require:true
       },
       views:{
        type:Number,
        default:0
       },
       isPublic:{
        type:Boolean,
        default:true
       },
       owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
       },
    },
    {timestamps:true}
)   
videoSchema.plugin(mongooseAggregatePaginate)


export const Video = mongoose.model("Video",videoSchema)