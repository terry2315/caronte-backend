import express from 'express';
import createNewUser from '../controller/user.js';

const router = express.Router();

router.post('/register', createNewUser);

export default router;