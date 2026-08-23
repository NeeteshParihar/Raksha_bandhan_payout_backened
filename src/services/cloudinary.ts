import { v2 as cloudinary } from 'cloudinary';
import '../config/cloundinary.js'; // Ensure cloudinary config is loaded

export const deleteCloudinaryFiles = async (publicIds: string[]) => {
    if (!publicIds || publicIds.length === 0) return;

    try {
        await cloudinary.api.delete_resources(publicIds);
        console.log(`Deleted ${publicIds.length} files from Cloudinary.`);
    } catch (error) {
        console.error("Error deleting files from Cloudinary:", error);
    }
};
