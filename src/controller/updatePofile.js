// Importamos el modelo User.
// Este modelo representa la colección de usuarios en MongoDB.
// Lo necesitamos para buscar usuarios, validar emails duplicados y actualizar el perfil.
import User from '../models/user.js';


// Esta función limpia textos normales como name, lastName y nationality.
// Hace dos cosas:
// 1. trim() elimina espacios al inicio y al final.
// 2. replace(/\s+/g, ' ') convierte varios espacios seguidos en un solo espacio.
//
// Ejemplo:
// "   Terry     Guzman   "
// se convierte en:
// "Terry Guzman"
const normalizeText = (value) => {
    return value.trim().replace(/\s+/g, ' ');
};


// Esta función recibe un usuario de MongoDB y construye una respuesta segura.
// Su objetivo es decidir exactamente qué datos se devuelven al frontend.
//
// Esto es importante porque no queremos devolver todo el documento completo.
// Por ejemplo, aquí NO devolvemos password, googleId ni __v.
const formatProfileResponse = (user) => {
    return {
        // Convertimos _id a id para que el frontend trabaje con un nombre más limpio.
        id: user._id,

        // Datos personales visibles y editables.
        name: user.name,
        lastName: user.lastName,
        age: user.age,
        email: user.email,
        phone: user.phone,
        nationality: user.nationality,
        avatar: user.avatar,

        // Datos útiles para saber cómo fue creada la cuenta.
        authProvider: user.authProvider,

        // Indica si el email está verificado.
        isEmailVerified: user.isEmailVerified,

        // Indica si el perfil tiene los datos mínimos completos.
        profileCompleted: user.profileCompleted,

        // Rol del usuario. Puede servir en el frontend para mostrar opciones según permisos.
        role: user.role,

        // Fechas de creación y última actualización.
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};


// Esta función valida si un texto es una URL válida de tipo http o https.
// Se usa para validar el campo avatar.
//
// La función intenta crear una URL usando new URL(value).
// Si el valor no es una URL válida, JavaScript lanza error y el catch devuelve false.
const isValidHttpUrl = (value) => {
    try {
        const url = new URL(value);

        // Solo permitimos URLs que empiecen con http:// o https://
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        // Si new URL(value) falla, significa que no es una URL válida.
        return false;
    }
};


// Controlador principal para actualizar el perfil del usuario autenticado.
// Esta función será usada en la ruta:
//
// PATCH /profile
//
// Flujo general:
// 1. Verifica que el usuario esté autenticado.
// 2. Lee los datos enviados desde el frontend.
// 3. Rechaza campos prohibidos.
// 4. Rechaza campos desconocidos.
// 5. Valida campo por campo.
// 6. Construye un objeto seguro llamado updateData.
// 7. Actualiza el usuario en MongoDB.
// 8. Devuelve el perfil actualizado.
const updateProfile = async (req, res) => {
    try {
        // Verificamos que el middleware de autenticación haya agregado req.user.
        // Si req.user no existe, significa que el usuario no está autenticado.
        //
        // Este req.user viene del authMiddleware después de validar la cookie accessToken.
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }

        // Guardamos el body de la petición en una variable.
        // Aquí vienen los datos que el frontend quiere actualizar.
        const body = req.body;

        // Validamos que el body exista y que no esté vacío.
        //
        // No tiene sentido aceptar una petición PATCH /profile sin datos.
        if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No se enviaron datos para actualizar'
            });
        }

        // Lista blanca de campos permitidos.
        //
        // Solo estos campos pueden ser editados por el usuario desde esta ruta.
        // Cualquier otro campo será rechazado.
        const allowedFields = [
            'name',
            'lastName',
            'age',
            'email',
            'phone',
            'nationality',
            'avatar'
        ];

        // Lista de campos prohibidos.
        //
        // Estos campos NO deben ser modificados directamente por el usuario.
        // Por ejemplo, un usuario no debe poder cambiarse el role a admin.
        const forbiddenFields = [
            '_id',
            'id',
            'password',
            'role',
            'isActive',
            'authProvider',
            'googleId',
            'isEmailVerified',
            'profileCompleted',
            'createdAt',
            'updatedAt',
            '__v'
        ];

        // Obtenemos todos los nombres de campos que llegaron desde el frontend.
        //
        // Ejemplo:
        // body = { name: "Terry", role: "admin" }
        // receivedFields = ["name", "role"]
        const receivedFields = Object.keys(body);

        // Revisamos si el usuario intentó mandar algún campo prohibido.
        //
        // Si body contiene "role", "password", "isActive", etc.,
        // lo detectamos aquí.
        const invalidForbiddenFields = receivedFields.filter((field) =>
            forbiddenFields.includes(field)
        );

        // Si se intentó actualizar un campo prohibido, rechazamos la petición.
        //
        // Esto protege contra intentos como:
        // { "role": "admin" }
        if (invalidForbiddenFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Intento de actualizar campos no permitidos',
                fields: invalidForbiddenFields
            });
        }

        // Revisamos si llegaron campos desconocidos.
        //
        // Es decir, campos que no están ni permitidos ni deberían procesarse.
        //
        // Ejemplo:
        // { "last_name": "Guzman" }
        //
        // Si tu backend espera lastName, entonces last_name será rechazado.
        const unknownFields = receivedFields.filter((field) =>
            !allowedFields.includes(field)
        );

        // Si hay campos desconocidos, rechazamos la petición.
        //
        // Esto obliga al frontend a enviar nombres de campos correctos.
        if (unknownFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Campos desconocidos o no permitidos',
                fields: unknownFields
            });
        }

        // Objeto donde guardaremos los errores de validación.
        //
        // Ejemplo:
        // errors = {
        //   age: "La edad debe ser un número entero",
        //   phone: "El teléfono debe tener al menos 7 números"
        // }
        const errors = {};

        // Objeto donde guardaremos solo los datos ya limpios y validados.
        //
        // Este es el objeto que finalmente se usará para actualizar MongoDB.
        const updateData = {};

        // Expresión regular para nombres, apellidos y nacionalidad.
        //
        // Permite:
        // - Letras normales
        // - Letras con acentos
        // - Ñ y ñ
        // - Espacios
        // - Apóstrofes
        // - Guiones
        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s'-]+$/;

        // Expresión regular básica para validar emails.
        const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

        // Expresión regular para teléfonos.
        //
        // Permite:
        // - Números
        // - Espacios
        // - Signo +
        // - Guiones
        // - Paréntesis
        const phoneRegex = /^[0-9+\s\-()]+$/;


        // =========================
        // VALIDACIÓN DE name
        // =========================

        // Solo validamos name si vino en el body.
        // Como es PATCH, no obligamos a enviar todos los campos.
        if ('name' in body) {
            // Validamos que name sea texto.
            if (typeof body.name !== 'string') {
                errors.name = 'El nombre debe ser texto';
            } else {
                // Limpiamos espacios innecesarios.
                const cleanName = normalizeText(body.name);

                // Validamos que no quede vacío después de limpiar.
                if (!cleanName) {
                    errors.name = 'El nombre es obligatorio';

                // Validamos longitud mínima.
                } else if (cleanName.length < 2) {
                    errors.name = 'El nombre debe tener al menos 2 caracteres';

                // Validamos longitud máxima.
                } else if (cleanName.length > 60) {
                    errors.name = 'El nombre no puede tener más de 60 caracteres';

                // Validamos caracteres permitidos.
                } else if (!nameRegex.test(cleanName)) {
                    errors.name = 'El nombre solo puede contener letras, espacios, acentos, apóstrofes o guiones';

                // Si pasa todas las validaciones, lo agregamos a updateData.
                } else {
                    updateData.name = cleanName;
                }
            }
        }


        // =========================
        // VALIDACIÓN DE lastName
        // =========================

        // Validamos lastName solo si llegó en la petición.
        if ('lastName' in body) {
            // Debe ser texto.
            if (typeof body.lastName !== 'string') {
                errors.lastName = 'El apellido debe ser texto';
            } else {
                // Limpiamos espacios innecesarios.
                const cleanLastName = normalizeText(body.lastName);

                // No puede quedar vacío.
                if (!cleanLastName) {
                    errors.lastName = 'El apellido es obligatorio';

                // Debe tener al menos 2 caracteres.
                } else if (cleanLastName.length < 2) {
                    errors.lastName = 'El apellido debe tener al menos 2 caracteres';

                // No debe ser demasiado largo.
                } else if (cleanLastName.length > 60) {
                    errors.lastName = 'El apellido no puede tener más de 60 caracteres';

                // Debe tener caracteres válidos.
                } else if (!nameRegex.test(cleanLastName)) {
                    errors.lastName = 'El apellido solo puede contener letras, espacios, acentos, apóstrofes o guiones';

                // Si todo está bien, se guarda para actualizar.
                } else {
                    updateData.lastName = cleanLastName;
                }
            }
        }


        // =========================
        // VALIDACIÓN DE age
        // =========================

        // Validamos age solo si vino en el body.
        if ('age' in body) {
            // Permitimos que age se limpie enviando null o string vacío.
            if (body.age === null || body.age === '') {
                updateData.age = null;
            } else {
                // Convertimos el valor recibido a número.
                //
                // Esto permite aceptar:
                // "33" → 33
                const ageNumber = Number(body.age);

                // Validamos que sea número entero.
                if (!Number.isInteger(ageNumber)) {
                    errors.age = 'La edad debe ser un número entero';

                // Validamos edad mínima.
                } else if (ageNumber < 18) {
                    errors.age = 'La edad mínima permitida es 18 años';

                // Validamos edad máxima.
                } else if (ageNumber > 100) {
                    errors.age = 'La edad máxima permitida es 100 años';

                // Si pasa las validaciones, se guarda como número.
                } else {
                    updateData.age = ageNumber;
                }
            }
        }


        // =========================
        // VALIDACIÓN DE email
        // =========================

        // Validamos email solo si vino en el body.
        if ('email' in body) {
            // El email debe ser texto.
            if (typeof body.email !== 'string') {
                errors.email = 'El correo electrónico debe ser texto';
            } else {
                // Limpiamos espacios y convertimos a minúsculas.
                const cleanEmail = body.email.trim().toLowerCase();

                // Validamos que no esté vacío.
                if (!cleanEmail) {
                    errors.email = 'El correo electrónico es obligatorio';

                // Validamos formato de email.
                } else if (!emailRegex.test(cleanEmail)) {
                    errors.email = 'El correo electrónico no tiene un formato válido';

                // Evitamos emails demasiado largos.
                } else if (cleanEmail.length > 120) {
                    errors.email = 'El correo electrónico es demasiado largo';
                } else {
                    // Buscamos si otro usuario ya tiene este email.
                    //
                    // La condición:
                    // _id: { $ne: req.user._id }
                    //
                    // significa:
                    // "Busca usuarios con este email, pero que NO sean el usuario actual."
                    const existingUser = await User.findOne({
                        email: cleanEmail,
                        _id: { $ne: req.user._id }
                    });

                    // Si existe otro usuario con ese email, no permitimos actualizar.
                    if (existingUser) {
                        errors.email = 'Este correo electrónico ya está registrado';
                    } else {
                        // Si el email está disponible, lo agregamos a updateData.
                        updateData.email = cleanEmail;

                        // Si el usuario cambió su email, marcamos isEmailVerified como false.
                        //
                        // Esto es lógico porque el nuevo email todavía no ha sido verificado.
                        if (cleanEmail !== req.user.email) {
                            updateData.isEmailVerified = false;
                        }
                    }
                }
            }
        }


        // =========================
        // VALIDACIÓN DE phone
        // =========================

        // Validamos phone solo si vino en el body.
        if ('phone' in body) {
            // Permitimos limpiar el teléfono con null o string vacío.
            if (body.phone === null || body.phone === '') {
                updateData.phone = '';

            // Permitimos que phone llegue como string o number.
            } else if (typeof body.phone !== 'string' && typeof body.phone !== 'number') {
                errors.phone = 'El teléfono debe ser texto o número';
            } else {
                // Convertimos a string, limpiamos espacios al inicio/final
                // y reducimos espacios múltiples a uno solo.
                const cleanPhone = String(body.phone).trim().replace(/\s+/g, ' ');

                // digitsOnly elimina todo lo que no sea número.
                //
                // Ejemplo:
                // "+1 754-262-0939" → "17542620939"
                const digitsOnly = cleanPhone.replace(/\D/g, '');

                // Validamos caracteres permitidos.
                if (!phoneRegex.test(cleanPhone)) {
                    errors.phone = 'El teléfono solo puede contener números, espacios, +, -, o paréntesis';

                // Validamos cantidad mínima de dígitos.
                } else if (digitsOnly.length < 7) {
                    errors.phone = 'El teléfono debe tener al menos 7 números';

                // Validamos cantidad máxima de dígitos.
                } else if (digitsOnly.length > 15) {
                    errors.phone = 'El teléfono no debe tener más de 15 números';

                // Validamos longitud total del string.
                } else if (cleanPhone.length > 25) {
                    errors.phone = 'El teléfono es demasiado largo';

                // Si todo está bien, lo guardamos.
                } else {
                    updateData.phone = cleanPhone;
                }
            }
        }


        // =========================
        // VALIDACIÓN DE nationality
        // =========================

        // Validamos nationality solo si vino en el body.
        if ('nationality' in body) {
            // Permitimos limpiar nationality con null o string vacío.
            if (body.nationality === null || body.nationality === '') {
                updateData.nationality = '';

            // Si viene con valor, debe ser texto.
            } else if (typeof body.nationality !== 'string') {
                errors.nationality = 'La nacionalidad debe ser texto';
            } else {
                // Limpiamos espacios.
                const cleanNationality = normalizeText(body.nationality);

                // Validamos longitud mínima.
                if (cleanNationality.length < 2) {
                    errors.nationality = 'La nacionalidad debe tener al menos 2 caracteres';

                // Validamos longitud máxima.
                } else if (cleanNationality.length > 60) {
                    errors.nationality = 'La nacionalidad no puede tener más de 60 caracteres';

                // Validamos caracteres permitidos.
                } else if (!nameRegex.test(cleanNationality)) {
                    errors.nationality = 'La nacionalidad solo puede contener letras, espacios, acentos, apóstrofes o guiones';

                // Si todo está bien, se guarda.
                } else {
                    updateData.nationality = cleanNationality;
                }
            }
        }


        // =========================
        // VALIDACIÓN DE avatar
        // =========================

        // Validamos avatar solo si vino en el body.
        if ('avatar' in body) {
            // Permitimos limpiar avatar con null o string vacío.
            if (body.avatar === null || body.avatar === '') {
                updateData.avatar = '';

            // Si viene con valor, debe ser texto.
            } else if (typeof body.avatar !== 'string') {
                errors.avatar = 'El avatar debe ser una URL válida';
            } else {
                // Limpiamos espacios.
                const cleanAvatar = body.avatar.trim();

                // Validamos longitud máxima para evitar strings enormes.
                if (cleanAvatar.length > 500) {
                    errors.avatar = 'La URL del avatar es demasiado larga';

                // Validamos que sea URL http o https.
                } else if (!isValidHttpUrl(cleanAvatar)) {
                    errors.avatar = 'El avatar debe ser una URL http o https válida';

                // Si todo está bien, se guarda.
                } else {
                    updateData.avatar = cleanAvatar;
                }
            }
        }


        // =========================
        // RESPUESTA SI HAY ERRORES
        // =========================

        // Si el objeto errors tiene alguna propiedad,
        // significa que uno o más campos no pasaron la validación.
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Datos inválidos',
                errors
            });
        }


        // =========================
        // VALIDACIÓN DE CAMPOS VÁLIDOS
        // =========================

        // Si updateData está vacío, significa que no hay nada válido para guardar.
        //
        // Puede pasar si el body llegó vacío o si los campos no generaron actualización.
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No se enviaron campos válidos para actualizar'
            });
        }


        // =========================
        // CÁLCULO DE profileCompleted
        // =========================

        // Creamos una versión simulada del perfil final.
        //
        // Combinamos:
        // - El usuario actual.
        // - Los nuevos datos que serán actualizados.
        //
        // Esto nos permite calcular si el perfil quedará completo después del cambio.
        const nextProfile = {
            ...req.user.toObject(),
            ...updateData
        };

        // profileCompleted será true solo si existen todos estos campos.
        //
        // En este caso, consideramos perfil completo si tiene:
        // name, lastName, age, email, phone y nationality.
        //
        // Boolean(...) convierte el resultado final en true o false.
        updateData.profileCompleted = Boolean(
            nextProfile.name &&
            nextProfile.lastName &&
            nextProfile.age &&
            nextProfile.email &&
            nextProfile.phone &&
            nextProfile.nationality
        );


        // =========================
        // ACTUALIZACIÓN EN MONGODB
        // =========================

        // Actualizamos el usuario autenticado usando su _id.
        //
        // No usamos un ID enviado desde el frontend.
        // Eso evita que alguien intente actualizar el perfil de otro usuario.
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,

            // $set actualiza solo los campos presentes en updateData.
            { $set: updateData },

            {
                // new: true devuelve el usuario actualizado,
                // no la versión anterior.
                new: true,

                // runValidators: true hace que Mongoose también aplique
                // las validaciones definidas en el schema.
                runValidators: true
            }

        // Excluimos datos sensibles o internos de la respuesta.
        ).select('-password -googleId -__v');


        // Si no se encontró el usuario, respondemos 404.
        //
        // Esto sería raro porque authMiddleware ya encontró el usuario,
        // pero puede pasar si fue eliminado entre la autenticación y la actualización.
        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }


        // =========================
        // RESPUESTA EXITOSA
        // =========================

        // Si todo salió bien, devolvemos el perfil actualizado
        // usando formatProfileResponse para controlar qué datos salen.
        return res.status(200).json({
            status: 'success',
            message: 'Perfil actualizado correctamente',
            profile: formatProfileResponse(updatedUser)
        });

    } catch (error) {
        // Este bloque captura errores inesperados.
        //
        // Por ejemplo:
        // - Error de conexión con MongoDB.
        // - Error de validación de Mongoose.
        // - Error por email duplicado.
        // - Error por req.user.toObject si req.user no fuera documento Mongoose.

        // Código 11000 en MongoDB significa duplicado.
        // En este caso, lo más probable sería email duplicado.
        if (error.code === 11000) {
            return res.status(409).json({
                status: 'error',
                message: 'El correo electrónico ya está registrado'
            });
        }

        // Respuesta genérica para cualquier otro error interno.
        //
        // En producción no conviene enviar error.stack al frontend.
        // Durante desarrollo puedes imprimir error.message en consola.
        return res.status(500).json({
            status: 'error',
            message: 'Error interno al actualizar el perfil'
        });
    }
};


// Exportamos el controlador para poder usarlo en routes/user.js
//
// Ejemplo:
// router.patch('/profile', authMiddleware, updateProfile);
export default updateProfile;


/*
1. Recibo PATCH / profile.

2. authMiddleware verifica que existe una cookie válida.

3. Si no hay sesión, rechazo con 401.

4. Si hay sesión, obtengo el usuario desde req.user.

5. Leo req.body.

6. Verifico si llegaron datos.

7. Creo una lista de campos permitidos.

8. Recorro los campos recibidos.

9. Si un campo no está permitido, no lo actualizo.

10. Si un campo permitido viene, lo valido según su tipo.

11. Si hay errores, respondo 400 con lista de errores.

12. Si todo está correcto, limpio los datos.

13. Actualizo en MongoDB usando req.user._id.

14. Devuelvo el perfil actualizado sin datos sensibles.
*/