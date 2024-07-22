const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');


exports.getEmergencias = async (req, res)=> {
   try {
    const pool = await getConnection()
    const result= await pool.request().query(querys.getEmergencias)
    res.json(result.recordset)
   } catch (error) {
    res.status(500);
    res.send(error.message);
   }
};

exports.getTipoEmergencia = async (req, res)=> {
    try {
     const pool = await getConnection()
     const result= await pool.request().query(querys.getTipoEmergencia)
     res.json(result.recordset)
    } catch (error) {
     res.status(500);
     res.send(error.message);
    }
 };

 exports.createNewEmergencia = async (req, res) => {
   const { folio,nombre,apellido_Paterno,apellido_Materno,lugar_Servicio,sexo,edad,ID_Emergencia,ID_Asociado} = req.body;
 
   // Verificar si todos los campos están presentes
   if (folio==null || nombre == null || apellido_Paterno == null || apellido_Materno == null || lugar_Servicio==null || sexo == null || edad == null || ID_Emergencia== null || ID_Asociado== null) {
     return res.status(400).json({ msg: "Por favor llene todos los campos" });
   }
 
   try {
     //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
     const pool = await getConnection();
     await pool.request()
       .input("folio", sql.Int, folio)
       .input("nombre", sql.VarChar, nombre)
       .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
       .input("apellido_Materno", sql.VarChar, apellido_Materno)
       .input("lugar_Servicio", sql.VarChar, lugar_Servicio)
       .input("sexo", sql.Char, sexo)
       .input("edad", sql.Int, edad)
       .input("ID_Emergencia", sql.VarChar,ID_Emergencia)
       .input("ID_Asociado", sql.Int,ID_Asociado)
       // Usa la contraseña cifrada
       .query(querys.createNewEmergencia);
 
     // Enviar respuesta de éxito
     res.json({folio,nombre,apellido_Paterno,apellido_Materno,lugar_Servicio,sexo,edad,ID_Emergencia,ID_Asociado});
   } catch (error) {
     // Enviar respuesta de error
     res.status(500).json({ error: error.message });
   }
 };