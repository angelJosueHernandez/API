require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

exports.getSuminitros = async (req, res)=> {
    try {
     const pool = await getConnection()
     const result= await pool.request().query(querys.getSuminitros)
     res.json(result.recordset)
    } catch (error) {
     res.status(500);
     res.send(error.message);
    }
 };

exports.registrarSuministro = async (req, res) => {
    const { clave,nombre_insumo,cantidad,lote,fecha_caducidad} = req.body;
  
    // Verificar si todos los campos están presentes
    if (clave==null || nombre_insumo == null || cantidad == null || lote == null || fecha_caducidad == null) {
      return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }
  
    try {
      const pool = await getConnection();
      await pool.request()
        .input("clave", sql.VarChar, clave)
        .input("nombre_insumo", sql.VarChar, nombre_insumo)
        .input("cantidad", sql.VarChar, cantidad)
        .input("lote", sql.VarChar, lote)
        .input("fecha_caducidad", sql.VarChar, fecha_caducidad)
        // Usa la contraseña cifrada
        .query(querys.registrarSuministro);
  
      // Enviar respuesta de éxito
      res.json({clave,nombre_insumo,cantidad,lote,fecha_caducidad});
    } catch (error) {
      // Enviar respuesta de error
      res.status(500).json({ error: error.message });
    }
};