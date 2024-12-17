require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.getDonaciones = async (req, res)=> {
    try {
     const pool = await getConnection()
     const result= await pool.request().query(querys.getDonaciones)
     res.json(result.recordset)
    } catch (error) {
     res.status(500);
     res.send(error.message);
    }
};

exports.getTotalDonations = async (req, res) => {
    try {
      // Conexión a la base de datos
      const pool = await getConnection();
  
      // Consulta SQL para sumar los montos
      const result = await pool.request().query(`
        SELECT SUM(monto) AS totalDonations FROM tbl_Donaciones
      `);
  
      // Extraer el total de la respuesta
      const { totalDonations } = result.recordset[0];
  
      // Enviar la respuesta en formato JSON
      res.json({ totalDonations });
    } catch (error) {
      // Manejo de errores
      res.status(500);
      res.send(error.message);
    }
};

exports.getTotalDonations = async (req, res) => {
  try {
    // Conexión a la base de datos
    const pool = await getConnection();

    // Consulta SQL para sumar los montos
    const result = await pool.request().query(`
      SELECT SUM(monto) AS totalDonations FROM tbl_Donaciones
    `);

    // Extraer el total de la respuesta
    const { totalDonations } = result.recordset[0];

    // Enviar la respuesta en formato JSON
    res.json({ totalDonations });
  } catch (error) {
    // Manejo de errores
    res.status(500);
    res.send(error.message);
  }
};


exports.getDonacionesMontoFecha = async (req, res) => {
  try {
    // Conexión a la base de datos
    const pool = await getConnection();

    // Consulta SQL para obtener monto y fecha
    const result = await pool.request().query(`
      SELECT monto, fecha FROM tbl_Donaciones
    `);

    // Extraer los datos del resultado
    const donations = result.recordset; // Array de objetos [{ monto, fecha }, ...]

    // Enviar la respuesta en formato JSON
    res.json({ donations });
  } catch (error) {
    // Manejo de errores
    res.status(500);
    res.send(error.message);
  }
};
