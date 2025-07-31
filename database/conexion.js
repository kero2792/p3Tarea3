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

function loginUsuario(correoelectronico, contrasena, estado, callback) {
    const request = new Request(
        'sp_LoginUsuario',
        (err) => {
            if (err) {
                console.error('Error en stored procedure:', err);
                callback(err, null);
                return;
            }
        }
    );

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
            console.error('Error en request:', err);
            callback(err, null);
        }
    });

    connection.callProcedure(request);
}

module.exports = { loginUsuario };