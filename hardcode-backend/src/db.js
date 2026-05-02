const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',

    // Password I used for my instance, replace with your own.
    password: '',

    database: 'queuesys',
    waitForConnections: true,
    connectionLimit: 10,
})

module.exports = pool;