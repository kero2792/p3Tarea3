const express = require('express');
const path = require('path');
const { loginUsuario, insertarUsuario } = require('../database/conexion');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const staticPath = path.join(__dirname, '..');
app.use(express.static(staticPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/crearCuenta.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'crearCuenta.html'));
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    loginUsuario(email, password, true, (err, user) => {
        if (res.headersSent) {
            return;
        }

        if (err) {
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

app.post('/crear-cuenta', (req, res) => {
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
        if (res.headersSent) {
            return;
        }

        if (err) {
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

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});