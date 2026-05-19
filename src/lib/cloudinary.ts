import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

/**
 * Generates a Cloudinary URL with auto-optimization and auto-format
 * @param publicId The public ID of the image in Cloudinary
 * @param options Additional transformation options
 */
export const getCloudinaryUrl = (publicId: string, options: any = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  });
};

/**
 * Generates a squared thumbnail URL
 */
export const getCloudinaryThumbnail = (publicId: string) => {
  return cloudinary.url(publicId, {
    crop: 'auto',
    gravity: 'auto',
    width: 500,
    height: 500,
    fetch_format: 'auto',
    quality: 'auto'
  });
};
