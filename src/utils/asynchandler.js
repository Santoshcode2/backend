//sirf ye ek method baneyega aur fir ese ye export kardega

// const asyncHandler = () => {}


export {asyncHandler}


const asyncHandler = (fn) =>{req,res,next} => {
    try{

    }catch (error){
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}