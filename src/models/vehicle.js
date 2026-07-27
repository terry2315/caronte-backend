import mongoose from 'mongoose';

const { Schema } = mongoose;

const VehicleSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El propietario es obligatorio'],
            index: true
        },

        status: {
            type: String,
            enum: [
                'draft',
                'pending',
                'published',
                'sold',
                'rejected',
                'archived'
            ],
            default: 'draft',
            index: true
        },

        basicInformation: {
            vehicleType: {
                type: String,
                trim: true,
                default: ''
            },

            brand: {
                type: String,
                trim: true,
                default: ''
            },

            model: {
                type: String,
                trim: true,
                default: ''
            },

            version: {
                type: String,
                trim: true,
                default: ''
            },

            /*
             * El campo year pertenece a basicInformation.
             * Esta versión reemplaza al year anterior.
             */
            year: {
                type: Number,
                default: null,
                min: [1886, 'El año del vehículo no es válido'],
                max: [
                    new Date().getFullYear() + 1,
                    'El año del vehículo no es válido'
                ],
                validate: {
                    validator: function (value) {
                        return value === null || Number.isInteger(value);
                    },
                    message: 'El año debe ser un número entero'
                }
            },

            exteriorColor: {
                type: String,
                trim: true,
                default: ''
            }
        },

        technicalInformation: {
            mileage: {
                type: Number,
                default: null,
                min: [
                    0,
                    'El kilometraje no puede ser negativo'
                ]
            },

            fuelType: {
                type: String,
                enum: [
                    'gasoline',
                    'diesel',
                    'electric',
                    'hybrid',
                    'gas',
                    'other'
                ]
            },

            transmission: {
                type: String,
                enum: [
                    'automatic',
                    'manual',
                    'cvt',
                    'other'
                ]
            },

            traction: {
                type: String,
                enum: [
                    'fwd',
                    'rwd',
                    'awd',
                    '4x4',
                    'other'
                ]
            },

            doors: {
                type: Number,
                default: null,
                min: [
                    1,
                    'El número de puertas no es válido'
                ],
                max: [
                    10,
                    'El número de puertas no es válido'
                ]
            },

            seats: {
                type: Number,
                default: null,
                min: [
                    1,
                    'El número de asientos no es válido'
                ],
                max: [
                    20,
                    'El número de asientos no es válido'
                ]
            }
        },

        conditionInformation: {
            generalCondition: {
                type: String,
                enum: [
                    'new',
                    'excellent',
                    'good',
                    'regular',
                    'repair'
                ]
            },

            hasAccidents: {
                type: Boolean,
                default: false
            },

            accidentDescription: {
                type: String,
                trim: true,
                maxlength: [
                    1000,
                    'La descripción del accidente es demasiado larga'
                ],
                default: ''
            },

            mechanicalIssues: {
                type: String,
                trim: true,
                maxlength: [
                    1000,
                    'La descripción de problemas mecánicos es demasiado larga'
                ],
                default: ''
            }
        },

        saleInformation: {
            price: {
                type: Number,
                default: null,
                min: [
                    0,
                    'El precio no puede ser negativo'
                ]
            },

            currency: {
                type: String,
                enum: ['USD', 'EUR', 'VES'],
                default: 'USD'
            },

            negotiable: {
                type: Boolean,
                default: false
            }
        },

        location: {
            country: {
                type: String,
                trim: true,
                default: ''
            },

            state: {
                type: String,
                trim: true,
                default: ''
            },

            city: {
                type: String,
                trim: true,
                default: ''
            }
        },

        description: {
            type: String,
            trim: true,
            maxlength: [
                3000,
                'La descripción no puede superar los 3000 caracteres'
            ],
            default: ''
        },

        images: [
            {
                url: {
                    type: String,
                    required: true
                },

                publicId: {
                    type: String,
                    default: ''
                },

                isCover: {
                    type: Boolean,
                    default: false
                }
            }
        ],

        publishedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model(
    'Vehicle',
    VehicleSchema,
    'vehicles'
);