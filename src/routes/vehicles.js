import express from 'express';

import {
    authMiddleware
} from '../middlewares/authMiddlewares.js';

import {
    parseVehicleImages
} from '../middlewares/uploadVehicleImages.js';

import {
    createVehicleDraft,
    updateVehicleDraft,
    getVehicleDraft,
    uploadVehicleImages,
    deleteVehicleImage,
    setVehicleCoverImage,
    publishVehicle,
    getMyVehicles
} from '../controller/vehicleController.js';

const router = express.Router();

/*
 * Crear borrador.
 */
router.post(
    '/',
    authMiddleware,
    createVehicleDraft
);

/*
 * Obtener todos los vehículos del usuario.
 *
 * Esta ruta debe estar antes de /:vehicleId.
 */
router.get(
    '/mine',
    authMiddleware,
    getMyVehicles
);

/*
 * Publicar vehículo.
 */
router.post(
    '/:vehicleId/publish',
    authMiddleware,
    publishVehicle
);

/*
 * Subir imágenes.
 */
router.post(
    '/:vehicleId/images',
    authMiddleware,
    parseVehicleImages,
    uploadVehicleImages
);

/*
 * Eliminar imagen.
 */
router.delete(
    '/:vehicleId/images/:imageId',
    authMiddleware,
    deleteVehicleImage
);

/*
 * Seleccionar portada.
 */
router.patch(
    '/:vehicleId/images/:imageId/cover',
    authMiddleware,
    setVehicleCoverImage
);

/*
 * Obtener un vehículo específico.
 */
router.get(
    '/:vehicleId',
    authMiddleware,
    getVehicleDraft
);

/*
 * Actualizar borrador.
 */
router.patch(
    '/:vehicleId',
    authMiddleware,
    updateVehicleDraft
);

export default router;