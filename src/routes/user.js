import express from 'express';
import createNewUser, { loginWithGoogle } from '../controller/user.js';
import { validateLogin } from '../controller/login.js'

const router = express.Router();

router.post('/register', createNewUser);
router.post('/auth/google', loginWithGoogle);
router.post('/login', validateLogin);

export default router;