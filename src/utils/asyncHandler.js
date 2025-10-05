const asyncHandler=(fn)=>{
    return async (req,res,next) => {
        try {
            await fn(req,res,next);
        } catch (err) {
           // console.log(err)  //use while debugging
            res.status(err.code||500).json({
                success:false,
                message:err.message
            })
        }
    }
}

export default asyncHandler;