import express from 'express';
import createNewUser, { loginWithGoogle } from '../controller/user.js';

const router = express.Router();

router.post('/register', createNewUser);
router.post('/auth/google', loginWithGoogle);

export default router;