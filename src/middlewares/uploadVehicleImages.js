
import multer from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 10;

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
        const error = new Error(
            'Solo se permiten imágenes JPG, PNG o WEBP'
        );

        error.statusCode = 415;

        return callback(error);
    }

    return callback(null, true);
};

const multerUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES_PER_REQUEST,
        fields: 5,
        parts: MAX_FILES_PER_REQUEST + 5
    }
});


export const parseVehicleImages = (req, res, next) => {
    const upload = multerUpload.array(
        'images',
        MAX_FILES_PER_REQUEST
    );

    upload(req, res, (error) => {
        if (!error) {
            return next();
        }

        console.error('Error procesando imágenes:', {
            name: error.name,
            code: error.code,
            message: error.message,
            field: error.field
        });

        if (error instanceof multer.MulterError) {
            const messages = {
                LIMIT_FILE_SIZE:
                    'Cada imagen puede pesar como máximo 5 MB',

                LIMIT_FILE_COUNT:
                    'Solo puedes subir hasta 10 imágenes por petición',

                LIMIT_UNEXPECTED_FILE:
                    'El campo de archivos debe llamarse images',

                LIMIT_PART_COUNT:
                    'La petición contiene demasiadas partes'
            };

            return res.status(400).json({
                status: 'error',
                message:
                    messages[error.code] ||
                    'No fue posible procesar las imágenes'
            });
        }

        return res
            .status(error.statusCode || 400)
            .json({
                status: 'error',
                message:
                    error.message ||
                    'Las imágenes proporcionadas no son válidas'
            });
    });
};




/*
import multer from 'multer';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    console.log('Archivo detectado por Multer:', {
        originalName: file.originalname,
        mimeType: file.mimetype
    });

    if (!allowedMimeTypes.has(file.mimetype)) {
        const error = new Error(
            'Solo se permiten imágenes JPG, PNG o WEBP'
        );

        error.statusCode = 415;

        return callback(error);
    }

    return callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES
    }
});

/*

export const parseVehicleImages = (req, res, next) => {
 
    console.log(
        'Content-Type antes de Multer:',
        req.get('content-type')
    );

    const uploadMiddleware = upload.array(
        'images',
        MAX_FILES
    );

    uploadMiddleware(req, res, (error) => {
        if (error) {
            console.error('Error de Multer:', {
                name: error.name,
                code: error.code,
                message: error.message,
                field: error.field
            });

            if (error instanceof multer.MulterError) {
                const messages = {
                    LIMIT_FILE_SIZE:
                        'Cada imagen puede pesar como máximo 5 MB',

                    LIMIT_FILE_COUNT:
                        'Solo puedes subir hasta 10 imágenes',

                    LIMIT_UNEXPECTED_FILE:
                        'El campo del archivo debe llamarse images'
                };

                return res.status(400).json({
                    status: 'error',
                    message:
                        messages[error.code] ||
                        error.message
                });
            }

            return res
                .status(error.statusCode || 400)
                .json({
                    status: 'error',
                    message:
                        error.message ||
                        'No fue posible procesar las imágenes'
                });
        }

        console.log(
            'Archivos procesados por Multer:',
            req.files?.map((file) => ({
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                hasBuffer: Boolean(file.buffer)
            }))
        );

        return next();
    });
};

*/