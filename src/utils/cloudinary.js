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


// Add a function to delete files
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        // Handle or log the error
        return null;
    }
};

// Helper to extract public ID
export const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split(".")[0];
    return publicId;
};