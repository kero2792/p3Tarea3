const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;

const config = {
    server: 'ENMANUEL-PC',
    authentication: {
        type: 'default',
        options: {
            userName: 'practicasProgramacion',
            password: '123456789'
        }
    },
    options: {
        port: 1434,
        database: 'tareaP3',
        trustServerCertificate: true,
        encrypt: false
    }
}

const connection = new Connection(config);

connection.connect();

connection.on('connect', (err) => {
    if (err) {
        console.error('Connection failed:', err);
    } else {
        console.log('Connected to the database successfully!');
    }
});

function executeStatement() {
    console.log('DB correctly connected');
}

function insertarUsuario(nombres, apellidos, telefono, correoelectronico, contrasena, callback) {
    const sqlQuery = `
        INSERT INTO usuarios (nombres, apellidos, telefono, correoelectronico, contrasena)
        VALUES (@nombres, @apellidos, @telefono, @correoelectronico, @contrasena)
    `;

    const request = new Request(sqlQuery, (err, rowCount) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, { success: true, message: 'Usuario creado exitosamente' });
    });

    request.addParameter('nombres', TYPES.NVarChar, nombres);
    request.addParameter('apellidos', TYPES.NVarChar, apellidos);
    request.addParameter('telefono', TYPES.BigInt, telefono);
    request.addParameter('correoelectronico', TYPES.NVarChar, correoelectronico);
    request.addParameter('contrasena', TYPES.NVarChar, contrasena);

    connection.execSql(request);
}

function insertarLibro(titulo, autor, editorial, anio_publicacion, isbn, precio, stock, callback) {
    let callbackCalled = false;

    const request = new Request('sp_InsertarLibro', (err) => {
        if (err) {
            if (!callbackCalled) {
                callbackCalled = true;
                callback(err, null);
            }
            return;
        }
    });

    request.addParameter('titulo', TYPES.NVarChar, titulo);
    request.addParameter('autor', TYPES.NVarChar, autor);
    request.addParameter('editorial', TYPES.NVarChar, editorial);
    request.addParameter('anio_publicacion', TYPES.Int, anio_publicacion);
    request.addParameter('isbn', TYPES.NVarChar, isbn);
    request.addParameter('precio', TYPES.Decimal, precio);
    request.addParameter('stock', TYPES.Int, stock);

    request.on('requestCompleted', (rowCount, more) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(null, { success: true, message: 'Libro insertado exitosamente' });
        }
    });

    request.on('error', (err) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(err, null);
        }
    });

    try {
        connection.callProcedure(request);
    } catch (error) {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(error, null);
        }
    }
}

function obtenerLibros(callback) {
    const sqlQuery = `
        SELECT id, titulo, autor, editorial, anio_publicacion, isbn, precio, stock, estado
        FROM libros 
        WHERE estado = 1
        ORDER BY titulo ASC
    `;

    const request = new Request(sqlQuery, (err) => {
        if (err) {
            callback(err, null);
            return;
        }
    });

    let libros = [];
    let callbackCalled = false;

    request.on('row', (columns) => {
        const libro = {};
        columns.forEach(column => {
            libro[column.metadata.colName] = column.value;
        });
        libros.push(libro);
    });

    request.on('requestCompleted', (rowCount, more) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(null, libros);
        }
    });

    request.on('error', (err) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(err, null);
        }
    });

    connection.execSql(request);
}

function loginUsuario(correoelectronico, contrasena, estado, callback) {
    const request = new Request('sp_LoginUsuario', (err) => {
        if (err) {
            callback(err, null);
            return;
        }
    });

    request.addParameter('correoelectronico', TYPES.NVarChar, correoelectronico);
    request.addParameter('contrasena', TYPES.NVarChar, contrasena);
    request.addParameter('estado', TYPES.Bit, estado);

    let user = null;
    let callbackCalled = false;

    request.on('row', columns => {
        user = {};
        columns.forEach(column => {
            user[column.metadata.colName] = column.value;
        });
    });

    request.on('requestCompleted', (rowCount, more) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(null, user);
        }
    });

    request.on('error', (err) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(err, null);
        }
    });

    connection.callProcedure(request);
}

// FUNCIÓN PARA ACTUALIZAR LIBRO
function actualizarLibro(id, titulo, autor, editorial, anio_publicacion, isbn, precio, stock, callback) {
    console.log('actualizarLibro llamada con:', { id, titulo, autor, editorial, anio_publicacion, isbn, precio, stock });

    let callbackCalled = false;

    const request = new Request('sp_ActualizarLibro', (err) => {
        if (err) {
            console.error('Error en stored procedure sp_ActualizarLibro:', err);
            if (!callbackCalled) {
                callbackCalled = true;
                callback(err, null);
            }
            return;
        }
    });

    request.addParameter('id', TYPES.Int, id);
    request.addParameter('titulo', TYPES.NVarChar, titulo);
    request.addParameter('autor', TYPES.NVarChar, autor);
    request.addParameter('editorial', TYPES.NVarChar, editorial);
    request.addParameter('anio_publicacion', TYPES.Int, anio_publicacion);
    request.addParameter('isbn', TYPES.NVarChar, isbn);
    request.addParameter('precio', TYPES.Decimal, precio);
    request.addParameter('stock', TYPES.Int, stock);

    request.on('requestCompleted', (rowCount, more) => {
        console.log('actualizarLibro completado, filas afectadas:', rowCount);
        if (!callbackCalled) {
            callbackCalled = true;
            callback(null, { success: true, message: 'Libro actualizado exitosamente', rowCount });
        }
    });

    request.on('error', (err) => {
        console.error('Error en actualizarLibro:', err);
        if (!callbackCalled) {
            callbackCalled = true;
            callback(err, null);
        }
    });

    try {
        connection.callProcedure(request);
    } catch (error) {
        console.error('Error al ejecutar callProcedure:', error);
        if (!callbackCalled) {
            callbackCalled = true;
            callback(error, null);
        }
    }
}

// VERIFICAR QUE LA FUNCIÓN EXISTE
console.log('actualizarLibro function defined:', typeof actualizarLibro);

module.exports = {
    loginUsuario,
    insertarUsuario,
    insertarLibro,
    obtenerLibros,
    actualizarLibro
};

// VERIFICAR EXPORTACIÓN
console.log('Exported functions:', Object.keys(module.exports));