import dotenv from 'dotenv';
import connectDB from './database/connectDB.js';
import dns from 'node:dns'
import app from './app.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const PORT = process.env.PORT || 3000;

const dbconnection = await connectDB();

if (!dbconnection.status) {
    console.error(dbconnection.message);

    if (dbconnection.error) {
        console.error(dbconnection.error);
    }
    process.exit(1);
}

console.log(dbconnection.message);


app.listen(PORT, () => {
    console.log(`📤  Servidor corriendo exitosamente en el puerto ${PORT} 🟢 !!`);
});

export default app;