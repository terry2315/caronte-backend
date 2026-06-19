import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
            minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
            maxlength: [50, 'El nombre no puede superar los 50 caracteres']
        },

        lastName: {
            type: String,
            required: [true, 'El apellido es obligatorio'],
            trim: true,
            minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
            maxlength: [50, 'El apellido no puede superar los 50 caracteres']
        },

        age: {
            type: Number,
            required: [true, 'La edad es obligatoria'],
            min: [1, 'La edad mínima es 1'],
            max: [120, 'La edad máxima es 120']
        },

        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'El email no tiene un formato válido'
            ]
        },

        phone: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            trim: true,
            match: [
                /^\+?[0-9\s-]{7,20}$/,
                'El teléfono no tiene un formato válido'
            ]
        },

        passwordHash: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            select: false
        },

        nationality: {
            type: String,
            required: [true, 'La nacionalidad es obligatoria'],
            trim: true,
            maxlength: [60, 'La nacionalidad no puede superar los 60 caracteres']
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
    }
});

export default mongoose.model('User', UserSchema, 'user');


