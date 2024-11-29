const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'mi_clave_secreta'; // Usa una clave secreta segura y guárdala en variables de entorno.


exports.getPersonal = async (req, res)=> {
   try {
    const pool = await getConnection()
    const result= await pool.request().query(querys.getPersonal)
    res.json(result.recordset)
   } catch (error) {
    res.status(500);
    res.send(error.message);
   }
};

exports.getTipoCargo = async (req, res)=> {
    try {
     const pool = await getConnection()
     const result= await pool.request().query(querys.getTipoCargo)
     res.json(result.recordset)
    } catch (error) {
     res.status(500);
     res.send(error.message);
    }
 };

 exports.createNewPersonal = async (req, res) => {
   const { ID_Asociado,nombre,apellidoP,apellidoM,correo,contrasena,estado,delegacion,Id_Cargo} = req.body;
 
   // Verificar si todos los campos están presentes
   if (ID_Asociado==null || nombre == null || apellidoP == null || apellidoM == null || correo == null || contrasena == null || estado == null || delegacion== null || Id_Cargo==null) {
     return res.status(400).json({ msg: "Por favor llene todos los campos" });
   }
 
   try {
     const hashedPassword = await bcrypt.hash(contrasena, 10); // Cifra la contraseña con bcrypt
     const pool = await getConnection();
     await pool.request()
       .input("ID_Asociado", sql.VarChar, ID_Asociado)
       .input("nombre", sql.VarChar, nombre)
       .input("apellidoP", sql.VarChar, apellidoP)
       .input("apellidoM", sql.VarChar, apellidoM)
       .input("correo", sql.VarChar, correo)
       .input("contrasena", sql.VarChar, hashedPassword)
       .input("estado", sql.VarChar, estado)
       .input("delegacion", sql.VarChar, delegacion)
       .input("Id_Cargo", sql.VarChar, Id_Cargo)
       // Usa la contraseña cifrada
       .query(querys.createNewPersonal);
 
     // Enviar respuesta de éxito
     res.json({ID_Asociado,nombre,apellidoP,apellidoM,correo,contrasena,estado,delegacion,Id_Cargo});
   } catch (error) {
     // Enviar respuesta de error
     res.status(500).json({ error: error.message });
   }
 };


 exports.updatePersonalById = async (req, res) => {

  const {Id_Cargo} = req.body;
  const {ID_Asociado}=req.params
    // Verificar si todos los campos están presentes
  if (Id_Cargo == null ) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("Id_Cargo", sql.VarChar, Id_Cargo)
      .input("ID_Asociado", sql.Int, ID_Asociado)
      // Usa la contraseña cifrada
      .query(querys.updatePersonalById);
    // Enviar respuesta de éxito
    res.json({Id_Cargo}); 
};


exports.updateEstadoPersonalById = async (req, res) => {

  const {estado_Usuario} = req.body;
  const {ID_Asociado}=req.params
    // Verificar si todos los campos están presentes
  if (estado_Usuario == null ) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("estado_Usuario", sql.VarChar, estado_Usuario)
      .input("ID_Asociado", sql.Int, ID_Asociado)
      // Usa la contraseña cifrada
      .query(querys.updateEstadoPersonalById);

    // Enviar respuesta de éxito
    res.json({estado_Usuario});
  
};


/* exports.deletePersonalById = async (req, res) => {

  const {ID_Asociado}=req.params

    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("ID_Asociado", sql.Int, ID_Asociado)
      // Usa la contraseña cifrada
      .query(querys.deletePersonalById);

    // Enviar respuesta de éxito
    res.json({mensaje: "El Personal fue Eliminado Correctamente" });
  
};*/


exports.authenticatePersonal = async (req, res) => {
  const { idIn, contraseña } = req.body;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("idIn", idIn)
      .query(querys.getPersonalLogin);

    if (result.recordset.length === 0) {
      // Si no se encuentra ningún usuario con el Id proporcionado
      return res.status(401).json({ mensaje: "Este Id No corresponde a ninguna Cuenta registrada" });
    }

    const user = result.recordset[0];

    if (user.estado_Usuario === 'Desactivado') {
      return res.status(401).json({ mensaje: "Tu cuenta está desactivada" });
    }

    // Verificar si la cuenta está bloqueada
    if (user.estado_Cuenta === 'Bloqueada') {
      return res.status(401).json({ mensaje: "Tu cuenta está bloqueada" });
    }

    const passwordMatch = await bcrypt.compare(contraseña, user.contrasena);
    if (passwordMatch) {
      // Si las contraseñas coinciden, generar un token JWT
      /*const token = jwt.sign(
        { id: user.id, estado_Cuenta: user.estado_Cuenta }, // Información relevante que quieras incluir en el token
        JWT_SECRET,
        { expiresIn: '8h' } // Duración de la sesión
      );*/

      await pool.request()
        .input("idIn", idIn)
        .query(querys.actualizarFechaInicioSesionPersonal);

      // Aquí enviamos una respuesta al cliente indicando que la autenticación ha sido exitosa
      return res.json({ 
        mensaje: "Autenticación exitosa", 
        autenticado: true,
        nombre: user.nombre, // Enviar el nombre del usuario
        //token, // Enviar el token al cliente
      });
    } else {
      // Si las contraseñas no coinciden
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }
  } catch (error) {
    console.error("Error de autenticación:", error);
    return res.status(500).json({ mensaje: "Error de autenticación" });
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Token no válido.' });
    }
    req.user = user; // Almacena los datos del usuario en la solicitud
    next();
  });
};
