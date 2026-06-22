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
            required: function () {
                return this.authProvider === 'local';
            },
            trim: true,
            minlength: [2, 'El apellido debe tener al menos 2 caracteres'],
            maxlength: [50, 'El apellido no puede superar los 50 caracteres'],
            default: ''
        },

        age: {
            type: Number,
            required: function () {
                return this.authProvider === 'local';
            },
            min: [1, 'La edad mínima es 1'],
            max: [120, 'La edad máxima es 120'],
            default: null
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
            required: function () {
                return this.authProvider === 'local';
            },
            trim: true,
            match: [
                /^\+?[0-9\s-]{7,20}$/,
                'El teléfono no tiene un formato válido'
            ],
            default: ''
        },

        passwordHash: {
            type: String,
            required: function () {
                return this.authProvider === 'local';
            },
            select: false
        },

        nationality: {
            type: String,
            required: function () {
                return this.authProvider === 'local';
            },
            trim: true,
            maxlength: [60, 'La nacionalidad no puede superar los 60 caracteres'],
            default: ''
        },

        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },

        googleId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        avatar: {
            type: String,
            default: ''
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        profileCompleted: {
            type: Boolean,
            default: function () {
                return this.authProvider === 'local';
            }
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
        delete ret.googleId;
        return ret;
    }
});

export default mongoose.model('User', UserSchema, 'user');