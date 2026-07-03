import express from 'express';
import createNewUser, { loginWithGoogle } from '../controller/user.js';
import { validateLogin } from '../controller/login.js';
import { authMiddleware } from '../middlewares/authMiddlewares.js';
import homeUser from '../controller/homeUser.js';
import logoutUser from '../controller/logoutUser.js';
import profileUser from '../controller/profileUser.js';
import updateProfile from '../controller/updatePofile.js';

const router = express.Router();

router.post('/register', createNewUser);
router.post('/auth/google', loginWithGoogle);
router.post('/login', validateLogin);
router.get('/home-user', authMiddleware, homeUser);
router.get('/profile', authMiddleware, profileUser);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/logout', logoutUser);

export default router;