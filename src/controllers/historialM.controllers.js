const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');


exports.getHistorialMedico = async (req, res)=> {
   try {
    const pool = await getConnection()
    const result= await pool.request().query(querys.getHistorialMedico)
    res.json(result.recordset)
   } catch (error) {
    res.status(500);
    res.send(error.message);
   }
};

exports.getAntecedentes = async (req, res)=> {
  try {
   const pool = await getConnection()
   const result= await pool.request().query(querys.getAntecedentePa)
   res.json(result.recordset)
  } catch (error) {
   res.status(500);
   res.send(error.message);
  }
};

exports.getHistorialMedicoById = async (req, res) => {
  const {ID_Historial}=req.params

    const pool = await getConnection();
    const result= await pool.request()
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.getHistorialMedicoById);
    // Enviar respuesta de éxito
    res.json(result.recordset); 
};

exports.getAntecedentesById = async (req, res) => {
  const {ID_Historial}=req.params
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    const result= await pool.request()
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.getAntecedentesById);
    // Enviar respuesta de éxito
    res.json(result.recordset); 
};

exports.getExpedienteById = async (req, res) => {
  const {ID_Historial}=req.params
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    const result= await pool.request()
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.getExpedienteById);
    // Enviar respuesta de éxito
    res.json(result.recordset); 
};

exports.createNewHistorialM = async (req, res) => {
   const { nombre,apellidoPaterno,apellidoMaterno,edad,municipio,colonia,calle,telefono,nombreContacto,
         apellidoPaternoContacto,apellidoMaternoContacto,telefonoContacto,medicamentosAlergicos} = req.body;
 
   // Verificar si todos los campos están presentes
   if (nombre == null || apellidoPaterno == null || apellidoMaterno == null || edad == null || 
    municipio == null || colonia == null || calle== null || telefono==null || nombreContacto==null || 
    apellidoPaternoContacto==null || apellidoMaternoContacto==null || telefonoContacto==null || medicamentosAlergicos==null) {
     return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }
 
   try {
     //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
     const pool = await getConnection();
     await pool.request()
       .input("nombre", sql.VarChar, nombre)
       .input("apellido_Paterno", sql.VarChar, apellidoPaterno)
       .input("apellido_Materno", sql.VarChar, apellidoMaterno)
       .input("edad", sql.VarChar, edad)
       .input("Municipio", sql.VarChar, municipio) 
       .input("colonia", sql.VarChar, colonia)
       .input("calle", sql.VarChar, calle)
       .input("telefono", sql.VarChar, telefono)
       .input("nombre_Contacto", sql.VarChar, nombreContacto)
       .input("apellidoP_Contacto", sql.VarChar, apellidoPaternoContacto)
       .input("apellidoM_Contacto", sql.VarChar, apellidoMaternoContacto)
       .input("telefono_Contacto", sql.VarChar, telefonoContacto)
       .input("alergico_Medicamento", sql.VarChar, medicamentosAlergicos)
     
       // Usa la contraseña cifrada
       .query(querys.createNewHistorialM);
 
     // Enviar respuesta de éxito
     res.json({nombre,apellidoPaterno,apellidoMaterno,edad,municipio,colonia,calle,telefono,nombreContacto,apellidoPaternoContacto,apellidoMaternoContacto,telefonoContacto,medicamentosAlergicos});
   } catch (error) {
     // Enviar respuesta de error
     res.status(500).json({ error: error.message });
     console.log(error.message );
   }
 };

 exports.createNewAntecedentes = async (req, res) => {
  const { nombreAn,fechaD,tratamiento} = req.body;

  // Verificar si todos los campos están presentes
  if (nombreAn == null || fechaD == null || tratamiento == null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

  try {
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("nombreAntecedente", sql.VarChar, nombreAn)
      .input("fecha_Diagnostico", sql.Date, fechaD)
      .input("tratamiento", sql.VarChar, tratamiento)
      // Usa la contraseña cifrada
      .query(querys.createNewAntecedentes);

    // Enviar respuesta de éxito
    res.json({nombreAn,fechaD,tratamiento});
  } catch (error) {
    // Enviar respuesta de error
    res.status(500).json({ error: error.message });
  }
};

exports.updateHistorialMedicoById = async (req, res) => {

  const {edad,Municipio,colonia,calle,telefono,nombre_Contacto,apellidoP_Contacto,apellidoM_Contacto,
    telefono_Contacto,alergico_Medicamento} = req.body;

  const {ID_Historial}=req.params
  
    // Verificar si todos los campos están presentes
  if (edad == null || Municipio == null || colonia == null || calle== null || telefono==null || nombre_Contacto==null 
    || apellidoP_Contacto==null || apellidoM_Contacto==null || telefono_Contacto==null || alergico_Medicamento==null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("edad", sql.VarChar, edad)
      .input("Municipio", sql.VarChar, Municipio) 
      .input("colonia", sql.VarChar, colonia)
      .input("calle", sql.VarChar, calle)
      .input("telefono", sql.VarChar, telefono)
      .input("nombre_Contacto", sql.VarChar, nombre_Contacto)
      .input("apellidoP_Contacto", sql.VarChar, apellidoP_Contacto)
      .input("apellidoM_Contacto", sql.VarChar, apellidoM_Contacto)
      .input("telefono_Contacto", sql.VarChar, telefono_Contacto)
      .input("alergico_Medicamento", sql.VarChar, alergico_Medicamento)
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.updateHistorialMedicoById);

    // Enviar respuesta de éxito
    res.json({edad,Municipio,colonia,calle,telefono,nombre_Contacto,apellidoP_Contacto,apellidoM_Contacto,
      telefono_Contacto,alergico_Medicamento});
  
};

exports.updateAntecedentesById = async (req, res) => {

  const {nombreAntecedente,fecha_Diagnostico,tratamiento} = req.body;

  const {ID_Historial}=req.params
  
    // Verificar si todos los campos están presentes
  if (nombreAntecedente == null || fecha_Diagnostico == null || tratamiento == null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("nombreAntecedente", sql.VarChar, nombreAntecedente)
      .input("fecha_Diagnostico", sql.Date, fecha_Diagnostico)
      .input("tratamiento", sql.VarChar, tratamiento)
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.updateAntecedentesById);

    // Enviar respuesta de éxito
    res.json({nombreAntecedente,fecha_Diagnostico,tratamiento});
  
};



exports.createNewAntecedentes2 = async (req, res) => {
  const { idH, nombreAntecedente,fecha_Diacnostico,tratamiento} = req.body;

  // Verificar si todos los campos están presentes
  if (nombreAntecedente == null || fecha_Diacnostico == null || tratamiento == null || idH == null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

  try {
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("idH", sql.Int, idH)
      .input("nombreAntecedente", sql.VarChar, nombreAntecedente)
      .input("fecha_Diacnostico", sql.Date, fecha_Diacnostico)
      .input("tratamiento", sql.VarChar, tratamiento)
      // Usa la contraseña cifrada
      .query(querys.createNewAntecedentes2);

    // Enviar respuesta de éxito
    res.json({nombreAntecedente,fecha_Diacnostico,tratamiento});
  } catch (error) {
    // Enviar respuesta de error
    res.status(500).json({ error: error.message });
    console.log(error);
    
  }
};



//////////////------------------------EXPEDIENTES-------------------------

exports.CreateNewExpedienteById = async (req, res) => {
  const {motivo,diagnostico_ingreso,diagnostico_egreso,medicamentos} = req.body;
  const {ID_Historial}=req.params
    // Verificar si todos los campos están presentes
  if (motivo == null || diagnostico_ingreso == null || diagnostico_egreso == null || medicamentos==null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("motivo", sql.VarChar, motivo)
      .input("diagnostico_ingreso", sql.VarChar, diagnostico_ingreso)
      .input("diagnostico_egreso", sql.VarChar, diagnostico_egreso)
      .input("medicamentos", sql.VarChar, medicamentos)
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.CreateNewExpedienteById);
    // Enviar respuesta de éxito
    res.json({motivo,diagnostico_ingreso,diagnostico_egreso,medicamentos});
  
};


exports.updateMedicamentoById = async (req, res) => {
  const {alergico_Medicamento} = req.body;
  const {ID_Historial}=req.params
    // Verificar si todos los campos están presentes
  if (alergico_Medicamento==null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("alergico_Medicamento", sql.VarChar, alergico_Medicamento)
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.updateMedicamentoById);
    // Enviar respuesta de éxito
    res.json({alergico_Medicamento});
};



exports.updateContactoEmergenciaById = async (req, res) => {
  const {nombre_Contacto,apellidoP_Contacto,apellidoM_Contacto,telefono_Contacto} = req.body;
  const {ID_Historial}=req.params
    // Verificar si todos los campos están presentes
  if (nombre_Contacto==null || apellidoP_Contacto==null || apellidoM_Contacto==null || telefono_Contacto==null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("nombre_Contacto", sql.VarChar, nombre_Contacto)
      .input("apellidoP_Contacto", sql.VarChar, apellidoP_Contacto)
      .input("apellidoM_Contacto", sql.VarChar, apellidoM_Contacto)
      .input("telefono_Contacto", sql.VarChar, telefono_Contacto)
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.updateContactoEmergenciaById);
    // Enviar respuesta de éxito
    res.json({nombre_Contacto,apellidoP_Contacto,apellidoM_Contacto,telefono_Contacto});
};

exports.updateInfoPerById = async (req, res) => {
  const {nombre, apellido_Paterno, apellido_Materno,edad, Municipio,colonia,calle, telefono} = req.body;
  const {ID_Historial}=req.params
    // Verificar si todos los campos están presentes
  if (Municipio == null || colonia == null || calle== null,nombre == null, apellido_Materno == null, apellido_Paterno == null , edad == null, telefono == null) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }
    //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
    .input("nombre", sql.VarChar, nombre) 
    .input("apellido_Paterno", sql.VarChar, apellido_Paterno) 
    .input("apellido_Materno", sql.VarChar, apellido_Materno) 
    .input("edad", sql.VarChar, edad) 
      .input("Municipio", sql.VarChar, Municipio) 
      .input("colonia", sql.VarChar, colonia)
      .input("calle", sql.VarChar, calle)
      .input("telefono", sql.VarChar, telefono) 
      .input("ID_Historial", sql.Int, ID_Historial)
      // Usa la contraseña cifrada
      .query(querys.updateDomicilioById);
    // Enviar respuesta de éxito
    res.json({nombre, apellido_Paterno, apellido_Materno,edad, Municipio,colonia,calle, telefono});
};
