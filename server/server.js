const express = require('express');
const path = require('path');
const { loginUsuario, insertarUsuario, insertarLibro, obtenerLibros, actualizarLibro, eliminarLibro } = require('../database/conexion');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

console.log('Serving static files from:', staticPath);

// ========== RUTAS HTML ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/crearCuenta.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'crearCuenta.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

// ========== RUTAS API ==========

// Ruta de login
app.post('/login', (req, res) => {
    console.log('POST /login - Datos recibidos:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    loginUsuario(email, password, true, (err, user) => {
        if (res.headersSent) return;

        if (err) {
            console.error('Error en login:', err);
            return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
            });
        }

        if (user) {
            return res.json({ success: true });
        } else {
            return res.json({
                success: false,
                message: 'Usuario no encontrado o credenciales incorrectas.'
            });
        }
    });
});

// Ruta para crear cuenta
app.post('/crear-cuenta', (req, res) => {
    console.log('POST /crear-cuenta - Datos recibidos:', req.body);

    const { nombre, apellido, telefono, correoelectronico, contrasena } = req.body;

    if (!nombre || !apellido || !telefono || !correoelectronico || !contrasena) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoelectronico)) {
        return res.status(400).json({
            success: false,
            message: 'El formato del correo electrónico no es válido'
        });
    }

    const telefonoNum = parseInt(telefono);
    if (isNaN(telefonoNum)) {
        return res.status(400).json({
            success: false,
            message: 'El teléfono debe ser un número válido'
        });
    }

    insertarUsuario(nombre, apellido, telefonoNum, correoelectronico, contrasena, (err, result) => {
        if (res.headersSent) return;

        if (err) {
            console.error('Error al crear cuenta:', err);
            if (err.message && err.message.includes('UNIQUE KEY constraint')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un usuario con ese correo electrónico'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al crear la cuenta'
            });
        }

        return res.json({
            success: true,
            message: 'Cuenta creada exitosamente'
        });
    });
});

// Ruta para obtener libros
app.get('/libros', (req, res) => {
    console.log('GET /libros - Obteniendo libros');

    obtenerLibros((err, libros) => {
        if (err) {
            console.error('Error al obtener libros:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener los libros'
            });
        }

        console.log('Libros obtenidos:', libros.length);
        return res.json({
            success: true,
            data: libros
        });
    });
});

// Ruta para insertar libro
app.post('/insertar-libro', (req, res) => {
    console.log('POST /insertar-libro - Datos recibidos:', req.body);

    const { titulo, autor, editorial, anio_publicacion, isbn, precio, stock } = req.body;

    if (!titulo || !autor) {
        return res.status(400).json({
            success: false,
            message: 'Título y autor son campos requeridos'
        });
    }

    if (titulo.trim().length === 0 || autor.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Título y autor no pueden estar vacíos'
        });
    }

    if (anio_publicacion && (anio_publicacion < 1000 || anio_publicacion > new Date().getFullYear())) {
        return res.status(400).json({
            success: false,
            message: 'Año de publicación no válido'
        });
    }

    if (precio && precio < 0) {
        return res.status(400).json({
            success: false,
            message: 'El precio no puede ser negativo'
        });
    }

    if (stock && stock < 0) {
        return res.status(400).json({
            success: false,
            message: 'El stock no puede ser negativo'
        });
    }

    insertarLibro(titulo, autor, editorial, anio_publicacion, isbn, precio, stock, (err, result) => {
        if (res.headersSent) return;

        if (err) {
            console.error('Error al insertar libro:', err);
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un libro con ese ISBN'
                });
            }

            if (err.message && err.message.includes('constraint')) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validación en los datos del libro'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al insertar el libro'
            });
        }

        return res.json({
            success: true,
            message: 'Libro insertado exitosamente',
            data: result
        });
    });
});

// Ruta para actualizar libro
app.put('/actualizar-libro/:id', (req, res) => {
    const libroId = req.params.id;
    console.log('PUT /actualizar-libro/' + libroId + ' - Datos:', req.body);

    const { titulo, autor, editorial, anio_publicacion, isbn, precio, stock } = req.body;

    // Validar que el ID sea un número válido
    const id = parseInt(libroId);
    if (!libroId || isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: 'ID de libro no válido'
        });
    }

    if (!titulo || !autor) {
        return res.status(400).json({
            success: false,
            message: 'Título y autor son campos requeridos'
        });
    }

    if (titulo.trim().length === 0 || autor.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Título y autor no pueden estar vacíos'
        });
    }

    if (anio_publicacion && (anio_publicacion < 1000 || anio_publicacion > new Date().getFullYear())) {
        return res.status(400).json({
            success: false,
            message: 'Año de publicación no válido'
        });
    }

    if (precio && precio < 0) {
        return res.status(400).json({
            success: false,
            message: 'El precio no puede ser negativo'
        });
    }

    if (stock && stock < 0) {
        return res.status(400).json({
            success: false,
            message: 'El stock no puede ser negativo'
        });
    }

    actualizarLibro(id, titulo, autor, editorial, anio_publicacion, isbn, precio, stock, (err, result) => {
        if (res.headersSent) return;

        if (err) {
            console.error('Error al actualizar libro:', err);
            if (err.message && err.message.includes('No se encontró el libro')) {
                return res.status(404).json({
                    success: false,
                    message: 'Libro no encontrado'
                });
            }

            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un libro con ese ISBN'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al actualizar el libro'
            });
        }

        console.log('Libro actualizado exitosamente:', result);
        return res.json({
            success: true,
            message: 'Libro actualizado exitosamente',
            data: result
        });
    });
});

// Ruta para eliminar libro (borrado lógico)
app.delete('/eliminar-libro/:id', (req, res) => {
    const libroId = req.params.id;
    console.log('DELETE /eliminar-libro/' + libroId);

    // Validar que el ID sea un número válido
    const id = parseInt(libroId);
    if (!libroId || isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: 'ID de libro no válido'
        });
    }

    eliminarLibro(id, (err, result) => {
        if (res.headersSent) return;

        if (err) {
            console.error('Error al eliminar libro:', err);
            if (err.message && err.message.includes('No se encontró el libro')) {
                return res.status(404).json({
                    success: false,
                    message: 'Libro no encontrado o ya está eliminado'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Error en el servidor al eliminar el libro'
            });
        }

        console.log('Libro eliminado exitosamente:', result);
        return res.json({
            success: true,
            message: 'Libro eliminado exitosamente',
            data: result
        });
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
    console.log('Rutas disponibles:');
    console.log('  GET  /');
    console.log('  GET  /dashboard.html');
    console.log('  GET  /crearCuenta.html');
    console.log('  POST /login');
    console.log('  POST /crear-cuenta');
    console.log('  GET  /libros');
    console.log('  POST /insertar-libro');
    console.log('  PUT  /actualizar-libro/:id');
    console.log('  DELETE /eliminar-libro/:id');
});