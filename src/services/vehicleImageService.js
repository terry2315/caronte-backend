import cloudinary from '../config/cloudinary.js';

export const uploadVehicleImage = ({
    buffer,
    vehicleId
}) => {
    return new Promise((resolve, reject) => {
        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder: `caronte/vehicles/${vehicleId}`,
                    resource_type: 'image',
                    unique_filename: true,
                    overwrite: false
                },
                (error, result) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!result) {
                        return reject(
                            new Error(
                                'Cloudinary no devolvió el resultado de la imagen'
                            )
                        );
                    }

                    return resolve(result);
                }
            );

        uploadStream.end(buffer);
    });
};

export const deleteVehicleImageFromCloudinary = (
    publicId
) => {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true
    });
};