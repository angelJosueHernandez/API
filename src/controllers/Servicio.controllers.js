const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

exports.getTiposServicio = async (req, res) => {
    try {
      const pool = await getConnection();
      if (!pool) {
        throw new Error("No se pudo establecer la conexión con la base de datos");
      }
      const result = await pool.request()
        .query(`
         SELECT tipo_Servicio FROM tbl_servicios`);
      res.json(result.recordset);
    } catch (error) {
      console.error("Error al obtener los tipos de servicio:", error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }; 
  

