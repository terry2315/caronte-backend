import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();


if (!cloudinaryUrl) {
    throw new Error(
        'La variable CLOUDINARY_URL no está definida en el archivo .env'
    );
}

/*
 * El SDK obtiene automáticamente cloud_name,
 * api_key y api_secret desde CLOUDINARY_URL.
 */
cloudinary.config({
    secure: true
});

export default cloudinary;