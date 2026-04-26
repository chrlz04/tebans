import mysql from 'mysql2/promise'

const useSSL = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  port:            Number(process.env.DB_PORT) || 3306,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:      0,
  ...(useSSL && {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  }),
})

export default pool