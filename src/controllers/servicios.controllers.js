const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

exports.getTiposServicio = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT ID_Servicio AS id, tipo_Servicio AS servicio, indicaciones_previas AS indicaciones, costo AS costos, descripcion AS descripcion
        FROM tbl_Servicios`);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener los tipos de servicio:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};
