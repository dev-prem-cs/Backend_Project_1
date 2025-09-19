import connectDB from "./db/db.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();

const PORT=process.env.PORT;

connectDB().then(()=>{
    app.listen(PORT || 8000 ,()=>{
        console.log(`Server started at PORT: ${PORT}`)
    })
}
).catch((err)=>{
    console.error("MongoDB connection failed !!!",err);
})