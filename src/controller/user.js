import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};

const createNewUser = async (req, res) => {
    try {
        const requiredFields = [
            'name',
            'lastName',
            'age',
            'email',
            'phone',
            'password',
            'nationality'
        ];

        const missingFields = requiredFields.filter((field) => {
            const value = req.body[field];

            return (
                value === undefined ||
                value === null ||
                value === '' ||
                (typeof value === 'string' && value.trim() === '')
            );
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Debes completar todos los datos solicitados',
                missingFields
            });
        }

        const {
            name,
            lastName,
            age,
            email,
            phone,
            password,
            nationality
        } = req.body;

        const normalizedEmail = email.trim().toLowerCase();

        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(409).json({
                status: 'error',
                message: 'El email ya está registrado'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            lastName: lastName.trim(),
            age: Number(age),
            email: normalizedEmail,
            phone: phone.trim(),
            passwordHash,
            nationality: nationality.trim(),
            authProvider: 'local',
            isEmailVerified: false,
            profileCompleted: true
        });

        const userSaved = await newUser.save();

        return res.status(201).json({
            status: 'success',
            message: 'Usuario creado correctamente',
            user: userSaved
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);

        if (error.code === 11000) {
            return res.status(409).json({
                status: 'error',
                message: 'El email ya está registrado'
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Error al crear el usuario'
        });
    }
};

export const loginWithGoogle = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                status: 'error',
                message: 'El token de Google es obligatorio'
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                status: 'error',
                message: 'Token de Google inválido'
            });
        }

        const {
            sub: googleId,
            email,
            email_verified: emailVerified,
            given_name: givenName,
            family_name: familyName,
            name,
            picture
        } = payload;

        if (!email || !emailVerified) {
            return res.status(401).json({
                status: 'error',
                message: 'La cuenta de Google no tiene un email verificado'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        let user = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { googleId }
            ]
        });

        if (!user) {
            user = await User.create({
                name: givenName || name || 'Usuario',
                lastName: familyName || '',
                email: normalizedEmail,
                authProvider: 'google',
                googleId,
                avatar: picture || '',
                isEmailVerified: true,
                profileCompleted: false
            });
        }

        if (user && !user.googleId) {
            user.googleId = googleId;
            user.authProvider = 'google';
            user.avatar = user.avatar || picture || '';
            user.isEmailVerified = true;
            await user.save();
        }

        if (!user.isActive) {
            return res.status(403).json({
                status: 'error',
                message: 'Este usuario está desactivado'
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            status: 'success',
            message: 'Autenticación con Google completada correctamente',
            token,
            user: {
                id: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                authProvider: user.authProvider,
                profileCompleted: user.profileCompleted
            }
        });

    } catch (error) {
        console.error('Error en login con Google:', error);

        return res.status(500).json({
            status: 'error',
            message: 'Error al autenticar con Google'
        });
    }
};

export default createNewUser;