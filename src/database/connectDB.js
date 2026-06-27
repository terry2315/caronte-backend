import mongoose from 'mongoose';

const connectDB = async () => {

    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            return {
                status: false,
                message: 'La variable MONGO_URI no esta definida en el archivo .env'
            };
        }

        await mongoose.connect(mongoURI);

        console.log('MongoDB host:', mongoose.connection.host);
        console.log('MongoDB database:', mongoose.connection.name);

        return {
            status: true,
            message: 'base de datos conectada exitosamente 🟢'
        };
    } catch (error) {
        return {
            status: false,
            message: 'Error al intentar conectar con la base de datos',
            error: error.message
        };
    }
};

export default connectDB;