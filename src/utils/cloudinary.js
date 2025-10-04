import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
}); 

export const uploadToCloudinary= async (filePath,folder)=>{
    try {
        const res= await cloudinary.uploader.upload(filePath,{
            folder:folder
        });
        fs.unlinkSync(filePath);
        return res;
    } catch (error) {
        fs.unlinkSync(filePath);
        throw new Error("Cloudinary upload failed");
    }
} 

export const deleteFromCloudinary= async (publicId)=>{
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw new Error("Cloudinary delete failed");
    }
}