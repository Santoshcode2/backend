import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResonse} from "../utils/ApiResponse"
import  jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
  try{
       const user = await User.findById(userId)
      const acessToken =  user.generateAccessToken()
      const refreshToken =  user.generateRefreshToken()

      //refresh token ko database me kaise dale
    user.refreshToken = refreshToken
    await  user.save({ validateBeforeSave :false })

    return{acessToken , refreshToken}



  }
  catch(error){
     throw new ApiError(500,"Something went wrong while generating refresh and access token ")
  }
}

const registerUser = asyncHandler( async (req,res) =>{
  // get user detail from front-end                      
  //validation - not empty
  // check if user already exist: username|email
  //check for images , check for avatar
  //upload them to cloudinary, avatar
  //create user object ->(but why ? ) ->kiuki mongodb me jab me data bhejunga tab - ye NO SQL database hai -| create entry in db |
  //remove password and refresh token field from respons 
  //check for user creation
  //return res  

  const {fullname,email,username,password} = req.body
  console.log("email: ",email);

//   if (fullname === ""){
//     throw new ApiError(400,"fullname is required")
//   }
if(
    [fullname,email,username,password].some((field)=>
        field ?.trim() === "")
){
     throw new ApiError(400,"All fields are required") 
}

   const existedUser = await  User.findOne({
     $or:[{ username },{ email }]
   })

   if(existedUser){
    throw new ApiError(409,"User with email or username already exist ")
   }

   console.log(req.files);

   const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath =  req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) &&  req.files.coverImage.length > 0 ){
         coverImageLocalPath = req.files.coverImage[0].path;
   }

   if(!avatarLocalPath){
             throw new ApiError(400,"Avatar file is required")
   }
   
  const avatar =  await  uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)


  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
}

const user  = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage:coverImage?.url || "",
   email,
   password,
   username:usernaem.toLowerCase()
})
  const createdUser =  await User.findById(user._id).select(
       "-password -refreshToken"
  )
  if(!createUser){
     throw new ApiError(500,"Something went wrong while registering a user")
  }
  
})


const loginUser = asyncHandler(async(req,res) => {
       // req body se data le aao
       // username or email 
       //find the user
       //passsword check
       //access and refresh token
       //send cookie
       
       const {email, username,password} = req.body

       if(!username && !email ){
        throw new ApiError(400," username or email is required ")
       }

      const user =  await  User.findOne({
        $or:[{username},{email}]
       })
       
      if(!user){
        throw new ApiError(404,"user doesnot exist ")
      }

      const isPasswordValid = await user.isPasswordCorrect(password)

      if(!isPasswordValid){
        throw new ApiError(401," invalid user credential ")
      }

     const {acessToken , refreshToken} = await  generateAccessAndRefreshTokens(user._id)

    const loggedInUser = user.findById(user._id).
    select("-password -refreshToken")

    //now i have to send the cookies
    const options =  { 
      httpOnly :true , //it means it can be modified by the server only 
      secure:true
    }

    return res
    .status(200)
    .cookie(" accessToken ", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
          200,
          {
            user:loggedInUser , accesstoken , refreshToken
          },
          " User logged In Successfully " 
        )

    )
})


const logoutUser = asyncHandler(async(req,res)=>{
    //logout karna matlab uske cookies delete karne padenge 
    await  User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken:undefined
        }
      },
      {
        new: true
      }
    )
    const options =  { 
      httpOnly :true , //it means it can be modified by the server only 
      secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResonse(200, {} ,"User logged Out"))
    
})

const refreshAccessToken = asyncHandler(async,(req,res) =>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
       throw new ApiError(401,"unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(
       incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
     )
   const user = await  User.findById(decodedToken?._id)
 
   
   if(!user ){
     throw new ApiError(401,"Invalid refresh Token")
 }
 
 if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401,"Refresh token is expired or used")
 }
 
 
 
    const options ={
     httpOnly: true,
     secure:true
    }  
 
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResonse(
       200,
       {accessToken, refreshToken: newRefreshToken},
       "Access token refreshed"
     )
    )
   } catch (error) {
       throw new ApiError(401,error?.message || "Invalid refresh token")
   }
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
     const {oldPassword , newPassword} = req.body 

    const user = await  User.findById(req.user?._id)
   const isPasswordCorrect = await  user.isPasswordCorrect(oldPassword)
  
   if(!isPasswordCorrect){
      throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword
  await  user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResonse(200,{},"Password Changed Successfully"))

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname,email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields ar erequired ")
  }
 const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
          fullname,
          email:email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResonse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res)=>
  {//we have to update the avatar
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing ")
    }

  const avatar =  await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  await Use.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
           avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(
    new ApiResonse(200,user,"Avatar Image Updated Successfully") 
  )


})

const updateUserCoverImage = asyncHandler(async(req,res)=>
  {//we have to update the avatar
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover file is missing ")
    }

  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on Cover file")
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
           avatar: avatar.url
      }
    },
    {new:true}
  ).select("-password")
  return res
  .status(200)
  .json(
    new ApiResonse(200,user,"Cover Image Updated Successfully") 
  )
})

//how to update the files

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}