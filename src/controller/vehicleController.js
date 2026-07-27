import mongoose from 'mongoose';
import Vehicle from '../models/vehicle.js';
import { uploadVehicleImage, deleteVehicleImageFromCloudinary } from '../services/vehicleImageService.js';


const isValidSection = (value) => {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
};

const applySectionUpdates = ({
    vehicle,
    sectionName,
    sectionData,
    allowedFields
}) => {
    if (!isValidSection(sectionData)) {
        return false;
    }

    let sectionWasUpdated = false;

    allowedFields.forEach((field) => {
        const fieldWasReceived =
            Object.prototype.hasOwnProperty.call(
                sectionData,
                field
            );

        if (!fieldWasReceived) {
            return;
        }

        const receivedValue = sectionData[field];

        /*
         * Los textos se limpian antes de guardarse.
         * Los números y booleanos se mantienen sin modificar.
         */
        const normalizedValue =
            typeof receivedValue === 'string'
                ? receivedValue.trim()
                : receivedValue;

        vehicle.set(
            `${sectionName}.${field}`,
            normalizedValue
        );

        sectionWasUpdated = true;
    });

    return sectionWasUpdated;
};

const validateVehicleForPublication = (vehicle) => {
    const missingFields = [];

    const basic = vehicle.basicInformation;
    const technical = vehicle.technicalInformation;
    const condition = vehicle.conditionInformation;
    const sale = vehicle.saleInformation;
    const location = vehicle.location;

    if (!basic?.vehicleType) {
        missingFields.push('basicInformation.vehicleType');
    }

    if (!basic?.brand) {
        missingFields.push('basicInformation.brand');
    }

    if (!basic?.model) {
        missingFields.push('basicInformation.model');
    }

    if (!basic?.year) {
        missingFields.push('basicInformation.year');
    }

    if (!basic?.exteriorColor) {
        missingFields.push('basicInformation.exteriorColor');
    }

    if (
        technical?.mileage === null ||
        technical?.mileage === undefined
    ) {
        missingFields.push('technicalInformation.mileage');
    }

    if (!technical?.fuelType) {
        missingFields.push('technicalInformation.fuelType');
    }

    if (!technical?.transmission) {
        missingFields.push('technicalInformation.transmission');
    }

    if (!technical?.traction) {
        missingFields.push('technicalInformation.traction');
    }

    if (
        technical?.doors === null ||
        technical?.doors === undefined
    ) {
        missingFields.push('technicalInformation.doors');
    }

    if (
        technical?.seats === null ||
        technical?.seats === undefined
    ) {
        missingFields.push('technicalInformation.seats');
    }

    if (!condition?.generalCondition) {
        missingFields.push(
            'conditionInformation.generalCondition'
        );
    }

    if (
        condition?.hasAccidents === true &&
        !condition?.accidentDescription?.trim()
    ) {
        missingFields.push(
            'conditionInformation.accidentDescription'
        );
    }

    if (
        sale?.price === null ||
        sale?.price === undefined ||
        sale.price <= 0
    ) {
        missingFields.push('saleInformation.price');
    }

    if (!sale?.currency) {
        missingFields.push('saleInformation.currency');
    }

    if (!location?.country) {
        missingFields.push('location.country');
    }

    if (!location?.state) {
        missingFields.push('location.state');
    }

    if (!location?.city) {
        missingFields.push('location.city');
    }

    if (!vehicle.description?.trim()) {
        missingFields.push('description');
    }

    if (!vehicle.images?.length) {
        missingFields.push('images');
    }

    const hasCoverImage = vehicle.images?.some(
        (image) => image.isCover
    );

    if (vehicle.images?.length && !hasCoverImage) {
        missingFields.push('coverImage');
    }

    return missingFields;
};

export const createVehicleDraft = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                status: 'error',
                message:
                    'Debes iniciar sesión para crear un vehículo'
            });
        }

        const vehicle = await Vehicle.create({
            owner: req.user._id
        });

        return res.status(201).json({
            status: 'success',
            message:
                'Borrador del vehículo creado correctamente',
            vehicle: {
                id: vehicle._id,
                status: vehicle.status,
                createdAt: vehicle.createdAt
            }
        });
    } catch (error) {
        console.error(
            'Error al crear el borrador del vehículo:',
            error
        );

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible crear el borrador del vehículo'
        });
    }
};

export const updateVehicleDraft = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        if (!mongoose.isValidObjectId(vehicleId)) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El identificador del vehículo no es válido'
            });
        }

        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El vehículo no existe o no pertenece al usuario autenticado'
            });
        }

        if (vehicle.status !== 'draft') {
            return res.status(409).json({
                status: 'error',
                message:
                    'Solo se pueden modificar publicaciones en estado borrador'
            });
        }

        const {
            basicInformation,
            technicalInformation,
            conditionInformation,
            saleInformation,
            location,
            description
        } = req.body ?? {};

        let hasUpdates = false;

        /*
         * Información básica.
         */
        const basicInformationUpdated =
            applySectionUpdates({
                vehicle,
                sectionName: 'basicInformation',
                sectionData: basicInformation,
                allowedFields: [
                    'vehicleType',
                    'brand',
                    'model',
                    'version',
                    'year',
                    'exteriorColor'
                ]
            });

        /*
         * Información técnica.
         */
        const technicalInformationUpdated =
            applySectionUpdates({
                vehicle,
                sectionName: 'technicalInformation',
                sectionData: technicalInformation,
                allowedFields: [
                    'mileage',
                    'fuelType',
                    'transmission',
                    'traction',
                    'doors',
                    'seats'
                ]
            });

        /*
         * Estado e historial del vehículo.
         */
        const conditionInformationUpdated =
            applySectionUpdates({
                vehicle,
                sectionName: 'conditionInformation',
                sectionData: conditionInformation,
                allowedFields: [
                    'generalCondition',
                    'hasAccidents',
                    'accidentDescription',
                    'mechanicalIssues'
                ]
            });

        /*
         * Información de venta.
         */
        const saleInformationUpdated =
            applySectionUpdates({
                vehicle,
                sectionName: 'saleInformation',
                sectionData: saleInformation,
                allowedFields: [
                    'price',
                    'currency',
                    'negotiable'
                ]
            });

        /*
         * Ubicación del vehículo.
         */
        const locationUpdated = applySectionUpdates({
            vehicle,
            sectionName: 'location',
            sectionData: location,
            allowedFields: [
                'country',
                'state',
                'city'
            ]
        });

        hasUpdates =
            basicInformationUpdated ||
            technicalInformationUpdated ||
            conditionInformationUpdated ||
            saleInformationUpdated ||
            locationUpdated;

        /*
         * La descripción no pertenece a un objeto interno,
         * por eso se actualiza por separado.
         */
        if (description !== undefined) {
            if (typeof description !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message:
                        'La descripción debe ser un texto'
                });
            }

            vehicle.description = description.trim();
            hasUpdates = true;
        }

        if (!hasUpdates) {
            return res.status(400).json({
                status: 'error',
                message:
                    'No se proporcionaron datos válidos para actualizar'
            });
        }

        /*
         * vehicle.save() ejecuta las validaciones del esquema:
         * enum, min, max, maxlength, etc.
         */
        await vehicle.save();

        return res.status(200).json({
            status: 'success',
            message: 'Borrador actualizado correctamente',
            vehicle
        });
    } catch (error) {
        console.error(
            'Error al actualizar el borrador del vehículo:',
            error
        );

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                status: 'error',
                message:
                    'Los datos del vehículo no son válidos',
                errors: Object.values(error.errors).map(
                    (currentError) => ({
                        field: currentError.path,
                        message: currentError.message
                    })
                )
            });
        }

        if (error.name === 'CastError') {
            return res.status(422).json({
                status: 'error',
                message:
                    'Uno de los campos contiene un tipo de dato incorrecto',
                field: error.path
            });
        }

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible actualizar el vehículo'
        });
    }
};

export const getVehicleDraft = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        if (!mongoose.isValidObjectId(vehicleId)) {
            return res.status(400).json({
                status: 'error',
                message: 'El identificador del vehículo no es válido'
            });
        }

        /*
         * Se busca utilizando:
         *
         * 1. El ID del vehículo.
         * 2. El propietario autenticado.
         * 3. El estado draft.
         *
         * De esta manera, un usuario no puede consultar
         * borradores pertenecientes a otra persona.
         */
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id,
            status: 'draft'
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El borrador no existe o no pertenece al usuario autenticado'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Borrador obtenido correctamente',
            vehicle
        });
    } catch (error) {
        console.error(
            'Error al obtener el borrador del vehículo:',
            error
        );

        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'El identificador del vehículo no es válido'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'No fue posible obtener el borrador del vehículo'
        });
    }
};

const MAX_VEHICLE_IMAGES = 12;

export const uploadVehicleImages = async (
    req,
    res
) => {
    const uploadedAssets = [];

    try {
        const { vehicleId } = req.params;
        const files = req.files ?? [];

        if (!mongoose.isValidObjectId(vehicleId)) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El identificador del vehículo no es válido'
            });
        }

        if (files.length === 0) {
            return res.status(400).json({
                status: 'error',
                message:
                    'Debes seleccionar al menos una imagen'
            });
        }

        /*
         * La búsqueda incluye owner para impedir que un
         * usuario agregue imágenes a vehículos ajenos.
         */
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El vehículo no existe o no pertenece al usuario autenticado'
            });
        }

        if (vehicle.status !== 'draft') {
            return res.status(409).json({
                status: 'error',
                message:
                    'Solo puedes agregar imágenes a un borrador'
            });
        }

        const currentImageCount =
            vehicle.images?.length ?? 0;

        const resultingImageCount =
            currentImageCount + files.length;

        if (
            resultingImageCount >
            MAX_VEHICLE_IMAGES
        ) {
            return res.status(422).json({
                status: 'error',
                message:
                    `Cada vehículo puede contener un máximo de ${MAX_VEHICLE_IMAGES} imágenes`,
                currentImageCount,
                availableSlots:
                    MAX_VEHICLE_IMAGES -
                    currentImageCount
            });
        }

        /*
         * Se suben secuencialmente para poder registrar
         * cuáles llegaron correctamente a Cloudinary.
         */
        for (const file of files) {
            const result =
                await uploadVehicleImage({
                    buffer: file.buffer,
                    vehicleId: vehicle._id.toString()
                });

            uploadedAssets.push({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
            });
        }

        const alreadyHasCover =
            vehicle.images.some(
                (image) => image.isCover
            );

        const newImages = uploadedAssets.map(
            (asset, index) => ({
                url: asset.url,
                publicId: asset.publicId,

                /*
                 * La primera imagen del primer grupo será
                 * automáticamente la portada.
                 */
                isCover:
                    !alreadyHasCover &&
                    index === 0
            })
        );

        vehicle.images.push(...newImages);

        await vehicle.save();

        return res.status(201).json({
            status: 'success',
            message:
                'Imágenes agregadas correctamente',
            images: vehicle.images,
            imageCount: vehicle.images.length
        });
    } catch (error) {
        console.error(
            'Error al subir imágenes del vehículo:',
            error
        );

        /*
         * Si Cloudinary recibió algunas imágenes pero después
         * ocurrió un error, intentamos eliminarlas para evitar
         * archivos huérfanos.
         */
        if (uploadedAssets.length > 0) {
            await Promise.allSettled(
                uploadedAssets.map((asset) =>
                    deleteVehicleImageFromCloudinary(
                        asset.publicId
                    )
                )
            );
        }

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                status: 'error',
                message:
                    'No fue posible guardar las imágenes en el vehículo',
                errors: Object.values(
                    error.errors
                ).map((currentError) => ({
                    field: currentError.path,
                    message:
                        currentError.message
                }))
            });
        }

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible subir las imágenes del vehículo'
        });
    }
};

export const deleteVehicleImage = async (req, res) => {
    try {
        const { vehicleId, imageId } = req.params;

        if (
            !mongoose.isValidObjectId(vehicleId) ||
            !mongoose.isValidObjectId(imageId)
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El identificador del vehículo o de la imagen no es válido'
            });
        }

        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El vehículo no existe o no pertenece al usuario autenticado'
            });
        }

        if (vehicle.status !== 'draft') {
            return res.status(409).json({
                status: 'error',
                message:
                    'Solo puedes eliminar imágenes de un vehículo en borrador'
            });
        }

        const image = vehicle.images.id(imageId);

        if (!image) {
            return res.status(404).json({
                status: 'error',
                message: 'La imagen no existe en este vehículo'
            });
        }

        const publicId = image.publicId;

        /*
         * Eliminamos el subdocumento de MongoDB.
         */
        vehicle.images.pull({
            _id: imageId
        });

        /*
         * Si después de eliminar la imagen ninguna quedó
         * como portada, se asigna la primera disponible.
         */
        const hasCover = vehicle.images.some(
            (currentImage) => currentImage.isCover
        );

        if (!hasCover && vehicle.images.length > 0) {
            vehicle.images[0].isCover = true;
        }

        await vehicle.save();

        /*
         * Después eliminamos el recurso de Cloudinary.
         * Si esto falla, el vehículo ya no tendrá una
         * referencia inválida dentro de MongoDB.
         */
        let cloudinaryDeleted = true;

        if (publicId) {
            try {
                const result =
                    await deleteVehicleImageFromCloudinary(
                        publicId
                    );

                cloudinaryDeleted = [
                    'ok',
                    'not found'
                ].includes(result?.result);
            } catch (cloudinaryError) {
                cloudinaryDeleted = false;

                console.error(
                    'No fue posible eliminar la imagen de Cloudinary:',
                    cloudinaryError
                );
            }
        }

        return res.status(200).json({
            status: 'success',
            message: cloudinaryDeleted
                ? 'Imagen eliminada correctamente'
                : 'La imagen fue eliminada del vehículo, pero quedó pendiente eliminarla del almacenamiento',
            images: vehicle.images,
            imageCount: vehicle.images.length,
            cloudinaryCleanupPending:
                !cloudinaryDeleted
        });
    } catch (error) {
        console.error(
            'Error al eliminar la imagen del vehículo:',
            error
        );

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible eliminar la imagen del vehículo'
        });
    }
};

export const setVehicleCoverImage = async (
    req,
    res
) => {
    try {
        const { vehicleId, imageId } = req.params;

        if (
            !mongoose.isValidObjectId(vehicleId) ||
            !mongoose.isValidObjectId(imageId)
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El identificador del vehículo o de la imagen no es válido'
            });
        }

        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El vehículo no existe o no pertenece al usuario autenticado'
            });
        }

        if (vehicle.status !== 'draft') {
            return res.status(409).json({
                status: 'error',
                message:
                    'Solo puedes modificar la portada de un vehículo en borrador'
            });
        }

        const selectedImage =
            vehicle.images.id(imageId);

        if (!selectedImage) {
            return res.status(404).json({
                status: 'error',
                message:
                    'La imagen seleccionada no existe en este vehículo'
            });
        }

        /*
         * Solo una imagen puede ser portada.
         */
        vehicle.images.forEach((image) => {
            image.isCover =
                image._id.toString() === imageId;
        });

        await vehicle.save();

        return res.status(200).json({
            status: 'success',
            message:
                'Imagen de portada actualizada correctamente',
            coverImage: selectedImage,
            images: vehicle.images
        });
    } catch (error) {
        console.error(
            'Error al seleccionar la portada:',
            error
        );

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible actualizar la imagen de portada'
        });
    }
};

export const publishVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        if (!mongoose.isValidObjectId(vehicleId)) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El identificador del vehículo no es válido'
            });
        }

        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.user._id
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'error',
                message:
                    'El vehículo no existe o no pertenece al usuario autenticado'
            });
        }

        if (vehicle.status !== 'draft') {
            return res.status(409).json({
                status: 'error',
                message:
                    'Solo se pueden publicar vehículos en estado borrador'
            });
        }

        if (!req.user.isActive) {
            return res.status(403).json({
                status: 'error',
                message:
                    'La cuenta del usuario está desactivada'
            });
        }

        if (!req.user.isEmailVerified) {
            return res.status(403).json({
                status: 'error',
                message:
                    'Debes verificar tu correo antes de publicar un vehículo'
            });
        }

        if (!req.user.profileCompleted) {
            return res.status(403).json({
                status: 'error',
                message:
                    'Debes completar tu perfil antes de publicar un vehículo'
            });
        }

        const missingFields =
            validateVehicleForPublication(vehicle);

        if (missingFields.length > 0) {
            return res.status(422).json({
                status: 'error',
                message:
                    'El borrador todavía no contiene toda la información necesaria',
                missingFields
            });
        }

        vehicle.status = 'published';
        vehicle.publishedAt = new Date();

        await vehicle.save();

        return res.status(200).json({
            status: 'success',
            message: 'Vehículo publicado correctamente',
            vehicle: {
                id: vehicle._id,
                status: vehicle.status,
                publishedAt: vehicle.publishedAt,
                basicInformation:
                    vehicle.basicInformation,
                saleInformation:
                    vehicle.saleInformation,
                location: vehicle.location,
                images: vehicle.images
            }
        });
    } catch (error) {
        console.error(
            'Error al publicar el vehículo:',
            error
        );

        if (error.name === 'ValidationError') {
            return res.status(422).json({
                status: 'error',
                message:
                    'Los datos del vehículo no son válidos',
                errors: Object.values(error.errors).map(
                    (currentError) => ({
                        field: currentError.path,
                        message: currentError.message
                    })
                )
            });
        }

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible publicar el vehículo'
        });
    }
};

const ALLOWED_VEHICLE_STATUS = [
    'draft',
    'pending',
    'published',
    'sold',
    'rejected',
    'archived'
];

export const getMyVehicles = async (req, res) => {
    try {
        const {
            status,
            page = '1',
            limit = '10'
        } = req.query;

        const parsedPage = Number.parseInt(page, 10);
        const parsedLimit = Number.parseInt(limit, 10);

        if (
            !Number.isInteger(parsedPage) ||
            parsedPage < 1
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El número de página debe ser un entero mayor que 0'
            });
        }

        if (
            !Number.isInteger(parsedLimit) ||
            parsedLimit < 1 ||
            parsedLimit > 50
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El límite debe ser un entero entre 1 y 50'
            });
        }

        if (
            status &&
            !ALLOWED_VEHICLE_STATUS.includes(status)
        ) {
            return res.status(400).json({
                status: 'error',
                message:
                    'El estado solicitado no es válido',
                allowedStatus: ALLOWED_VEHICLE_STATUS
            });
        }

        /*
         * El propietario siempre se obtiene del usuario autenticado.
         * Nunca debe recibirse desde req.body o req.query.
         */
        const filter = {
            owner: req.user._id
        };

        if (status) {
            filter.status = status;
        }

        const skip = (parsedPage - 1) * parsedLimit;

        const [
            vehicles,
            totalVehicles
        ] = await Promise.all([
            Vehicle.find(filter)
                .sort({
                    updatedAt: -1,
                    createdAt: -1
                })
                .skip(skip)
                .limit(parsedLimit)
                .lean(),

            Vehicle.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(
            totalVehicles / parsedLimit
        );

        /*
         * Creamos una respuesta adaptada para el frontend.
         * coverImage será la imagen principal de la tarjeta.
         */
        const formattedVehicles = vehicles.map(
            (vehicle) => {
                const coverImage =
                    vehicle.images?.find(
                        (image) => image.isCover
                    ) ??
                    vehicle.images?.[0] ??
                    null;

                return {
                    id: vehicle._id,
                    status: vehicle.status,

                    basicInformation:
                        vehicle.basicInformation,

                    technicalInformation:
                        vehicle.technicalInformation,

                    saleInformation:
                        vehicle.saleInformation,

                    location: vehicle.location,

                    coverImage,

                    imageCount:
                        vehicle.images?.length ?? 0,

                    publishedAt:
                        vehicle.publishedAt,

                    createdAt:
                        vehicle.createdAt,

                    updatedAt:
                        vehicle.updatedAt
                };
            }
        );

        return res.status(200).json({
            status: 'success',
            message:
                totalVehicles > 0
                    ? 'Vehículos obtenidos correctamente'
                    : 'El usuario todavía no tiene vehículos',
            payload: formattedVehicles,
            pagination: {
                totalVehicles,
                totalPages,
                page: parsedPage,
                limit: parsedLimit,
                hasPrevPage:
                    parsedPage > 1,
                hasNextPage:
                    parsedPage < totalPages,
                prevPage:
                    parsedPage > 1
                        ? parsedPage - 1
                        : null,
                nextPage:
                    parsedPage < totalPages
                        ? parsedPage + 1
                        : null
            }
        });
    } catch (error) {
        console.error(
            'Error al consultar los vehículos del usuario:',
            error
        );

        return res.status(500).json({
            status: 'error',
            message:
                'No fue posible obtener los vehículos del usuario'
        });
    }
};