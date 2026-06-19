import User from '../models/user.js';
import bcrypt from 'bcrypt';

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
            age,
            email: normalizedEmail,
            phone: phone.trim(),
            passwordHash,
            nationality: nationality.trim()
        });

        const userSaved = await newUser.save();

        return res.status(201).json({
            status: 'success',
            message: 'Usuario creado correctamente',
            user: userSaved
        });

    } catch (error) {
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

export default createNewUser;