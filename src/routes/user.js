import express from 'express';
import createNewUser, { loginWithGoogle } from '../controller/user.js';
import { validateLogin } from '../controller/login.js'
import { authRequired } from '../middlewares/authrequired.js';

const router = express.Router();

router.get('/profile', authRequired, (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Acceso autorizado a ruta privada',
        user: req.user
    });
});

router.post('/register', createNewUser);
router.post('/auth/google', loginWithGoogle);
router.post('/login', validateLogin);

export default router;