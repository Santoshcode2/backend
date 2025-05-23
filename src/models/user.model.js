import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const  userSchema = new Schema(
    {
        username:{
            type:String,
            require:true,
            unique:true ,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            require:true,
            unique:true ,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            require:true,
            unique:true ,
            lowercase:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //cloudnary ka url
            require:true,
        },
        coverImage:{
            type:String, //cloudnary ka url
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"video"
            }
        ],
        password:{
            type:String,
            require:[true,'Password is require']
        },
        refereshToken:{
            type:String
        },
       
    }, {timesatmps:true}
)

userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();

    this.password= bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    //password check kaise kare 
    return  await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return  jwt.sign(
        {
            _id:this._id,
            email: this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        } 
    );
}
userSchema.methods.generateRefreshToken = function(){
    return  jwt.sign(
    {
        _id:this._id,
        email: this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
);
};


export const User = mongoose.model('User',userSchema)