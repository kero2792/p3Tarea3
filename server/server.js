const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { loginUsuario } = require('../database/conexion');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// Ruta para procesar el login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validar que se recibieron los datos
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    loginUsuario(email, password, true, (err, user) => {
        // Verificar si ya se envió una respuesta
        if (res.headersSent) {
            console.log('Headers ya enviados, ignorando respuesta adicional');
            return;
        }

        if (err) {
            console.error('Error en loginUsuario:', err);
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

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});