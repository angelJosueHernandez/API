require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.getContratacionAmbulancias = async (req, res)=> {
  try {
   const pool = await getConnection()
   const result= await pool.request().query(querys.getContratacionAmbulancias)
   res.json(result.recordset)
  } catch (error) {
   res.status(500);
   res.send(error.message);
  }
};

exports.createNewContratacionSinRegistrar = async (req, res) => {
    const { nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo, material_especifico,
        fecha, horario, ID_Tipo_Contratacion} = req.body;
  
    // Verificar si todos los campos están presentes
    if (nombre == null || apellido_Paterno == null || apellido_Materno == null || inicio_Traslado == null || escala == null || 
        destino_Traslado == null || motivo == null || material_especifico == null || fecha == null || horario == null ||
        ID_Tipo_Contratacion == null) {
      return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }
  
    try {
      const pool = await getConnection();

      // Convertir el horario a un formato válido para SQL Server usando moment
      const formattedHorario = moment(horario, 'HH:mm').format('HH:mm');
      console.log('Formatted Horario:', formattedHorario); // Agregar logueo

      // Insertar el registro con horario como VarChar
      await pool.request()
          .input("nombre", sql.VarChar, nombre)
          .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
          .input("apellido_Materno", sql.VarChar, apellido_Materno)
          .input("inicio_Traslado", sql.VarChar, inicio_Traslado)
          .input("escala", sql.VarChar, escala)
          .input("destino_Traslado", sql.VarChar, destino_Traslado)
          .input("motivo", sql.VarChar, motivo)
          .input("material_especifico", sql.VarChar, material_especifico)
          .input("fecha", sql.Date, fecha)
          .input("horario", sql.VarChar, formattedHorario) // Insertar como VarChar
          .input("ID_Tipo_Contratacion", sql.VarChar, ID_Tipo_Contratacion)
          // Usa la escala cifrada
          .query(querys.createContratacionSinRegistrar);

        // Enviar respuesta de éxito
        res.json({ nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo,
            material_especifico, fecha, horario: formattedHorario, ID_Tipo_Contratacion });
        } catch (error) {
        // Enviar respuesta de error
        console.error('Error al crear la contratación:', error); // Agregar logueo del error
        res.status(500).json({ error: error.message });
    }
};


exports.createNewContratacion = async (req, res) => {
    const { nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo, material_especifico,
        fecha, horario, ID_Usuario, ID_Tipo_Contratacion} = req.body;
  
    // Verificar si todos los campos están presentes
    if (nombre == null || apellido_Paterno == null || apellido_Materno == null || inicio_Traslado == null || escala == null || 
        destino_Traslado == null || motivo == null || material_especifico == null || fecha == null || horario == null ||
        ID_Usuario == null ||  ID_Tipo_Contratacion == null) {
      return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }
  
    try {
      const pool = await getConnection();
      

      // Convertir el horario a un formato válido para SQL Server usando moment
      const formattedHorario = moment(horario, 'HH:mm:ss').format('HH:mm:ss');
      console.log('Formatted Horario:', formattedHorario); // Agregar logueo

      // Insertar el registro con horario como VarChar
      await pool.request()
          .input("nombre", sql.VarChar, nombre)
          .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
          .input("apellido_Materno", sql.VarChar, apellido_Materno)
          .input("inicio_Traslado", sql.VarChar, inicio_Traslado)
          .input("escala", sql.VarChar, escala)
          .input("destino_Traslado", sql.VarChar, destino_Traslado)
          .input("motivo", sql.VarChar, motivo)
          .input("material_especifico", sql.VarChar, material_especifico)
          .input("fecha", sql.Date, fecha)
          .input("horario", sql.VarChar, formattedHorario) // Insertar como VarChar
          .input("ID_Usuario", sql.Int, ID_Usuario)
          .input('ID_Asociado', sql.Int, null) // Esto representa NULL en SQL Server
          .input("ID_Tipo_Contratacion", sql.VarChar, ID_Tipo_Contratacion)
          // Usa la escala cifrada
          .query(querys.createContratacion);

      // Actualizar el campo horario a tipo time
      await pool.request()
            .input("ID_Usuario", sql.Int, ID_Usuario)
            .input("ID_Asociado", sql.Int, ID_Asociado)
            .input("fecha", sql.Date, fecha)
            .query("UPDATE tbl_Contratacion_Ambulancia SET horario = CAST(horario AS time) WHERE ID_Usuario = @ID_Usuario AND ID_Asociado = @ID_Asociado AND fecha = @fecha");

      // Enviar respuesta de éxito
      res.json({ nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo,
          material_especifico, fecha, horario: formattedHorario, ID_Usuario, ID_Tipo_Contratacion });
  } catch (error) {
      // Enviar respuesta de error
      console.error('Error al crear la contratación:', error); // Agregar logueo del error
      res.status(500).json({ error: error.message });
  }
};

exports.getTipoContratacion = async (req, res)=> {
  try {
   const pool = await getConnection()
   const result= await pool.request().query(querys.getTipoContratacion)
   res.json(result.recordset)
  } catch (error) {
   res.status(500);
   res.send(error.message);
 }
};




exports.getAvailableAmbulances = async (req, res) => {
    try {
        const pool = await getConnection();

        // Obtener ambulancias disponibles
        const result = await pool.request().query(querys.getAvailableAmbulances);

        if (result.recordset.length > 0) {
            // Hay ambulancias disponibles
            res.json(result.recordset);
        } else {
            // No hay ambulancias disponibles
            res.status(400).json({ msg: "No hay ambulancias disponibles en este momento" });
        }
    } catch (error) {
        // Enviar respuesta de error
        console.error('Error al obtener las ambulancias disponibles:', error);
        res.status(500).json({ error: error.message });
    }
};



exports.createNewContratacion2 = async (req, res) => {
    const {
        nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo,
        material_especifico, fecha, horario, ID_Usuario, ID_Tipo_Contratacion, ambulanciaSeleccionada
    } = req.body;

    // Verificar si todos los campos están presentes
    if (!nombre || !apellido_Paterno || !apellido_Materno || !inicio_Traslado || !escala || 
        !destino_Traslado || !motivo || !material_especifico || !fecha || !horario ||
        !ID_Usuario || !ID_Tipo_Contratacion || !ambulanciaSeleccionada) {
        return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }

    try {
        const pool = await getConnection();

        // Asegurarse de que el horario esté en el formato 'HH:mm:ss'
        const formattedHorario = moment(horario, 'HH:mm').format('HH:mm:ss');
        console.log('formattedHorario:', formattedHorario);

        // Verificar si ya existe una contratación para la misma fecha y horario
        const existingContract = await pool.request()
            .input("fecha", sql.Date, fecha)
            .input("horario", sql.VarChar, formattedHorario)
            .query("SELECT * FROM tbl_Contratacion_Ambulancia WHERE fecha = @fecha AND horario = @horario");

        console.log('existingContract:', existingContract);

        if (existingContract.recordset && existingContract.recordset.length > 0) {
            const currentContract = existingContract.recordset[0];
            console.log('currentContract:', currentContract);

            // Verificar el estado de la contratación existente
            if (currentContract.estado === 'rechazada' || currentContract.estado === 'cancelada') {
                // Actualizar la contratación existente con los nuevos datos
                await pool.request()
                    .input("nombre", sql.VarChar, nombre)
                    .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
                    .input("apellido_Materno", sql.VarChar, apellido_Materno)
                    .input("inicio_Traslado", sql.VarChar, inicio_Traslado)
                    .input("escala", sql.VarChar, escala)
                    .input("destino_Traslado", sql.VarChar, destino_Traslado)
                    .input("motivo", sql.VarChar, motivo)
                    .input("material_especifico", sql.VarChar, material_especifico)
                    .input("fecha", sql.Date, fecha)
                    .input("horario", sql.VarChar, formattedHorario)
                    .input("ID_Usuario", sql.Int, ID_Usuario)
                    .input('ID_Asociado', sql.Int, null) // Mandar como null
                    .input("ID_Tipo_Contratacion", sql.VarChar, ID_Tipo_Contratacion)
                    .input("estado", sql.VarChar, 'revision')
                    .input("AmbulanciaID", sql.Int, ambulanciaSeleccionada)
                    .input("ID_Contratacion", sql.Int, currentContract.ID_Contratacion) // ID de la contratación actual
                    .query("UPDATE tbl_Contratacion_Ambulancia SET nombre = @nombre, apellido_Paterno = @apellido_Paterno, apellido_Materno = @apellido_Materno, inicio_Traslado = @inicio_Traslado, escala = @escala, destino_Traslado = @destino_Traslado, motivo = @motivo, material_especifico = @material_especifico, fecha = @fecha, horario = @horario, ID_Tipo_Contratacion = @ID_Tipo_Contratacion, estado = @estado, AmbulanciaID = @AmbulanciaID, ID_Asociado = @ID_Asociado, ID_Usuario = @ID_Usuario WHERE ID_Contratacion = @ID_Contratacion");

                // Actualizar el campo horario a tipo time
                await pool.request()
                    .input("ID_Contratacion", sql.Int, currentContract.ID_Contratacion)
                    .query("UPDATE tbl_Contratacion_Ambulancia SET horario = CAST(horario AS time) WHERE ID_Contratacion = @ID_Contratacion");

                // Actualizar el estado de la ambulancia a 'ocupada'
                await pool.request()
                    .input("AmbulanciaID", sql.Int, ambulanciaSeleccionada)
                    .query("UPDATE Ambulancias SET EstadoActual = 'Ocupada' WHERE AmbulanciaID = @AmbulanciaID");

                return res.json({ msg: "Contratación actualizada correctamente", estado: 'revision' });
            } else {
                return res.status(400).json({ msg: "Ya hay una contratación para esa fecha y hora" });
            }
        } else {
            // Insertar una nueva contratación y obtener el ID generado
            const result = await pool.request()
                .input("nombre", sql.VarChar, nombre)
                .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
                .input("apellido_Materno", sql.VarChar, apellido_Materno)
                .input("inicio_Traslado", sql.VarChar, inicio_Traslado)
                .input("escala", sql.VarChar, escala)
                .input("destino_Traslado", sql.VarChar, destino_Traslado)
                .input("motivo", sql.VarChar, motivo)
                .input("material_especifico", sql.VarChar, material_especifico)
                .input("fecha", sql.Date, fecha)
                .input("horario", sql.VarChar, formattedHorario) // Insertar como VarChar
                .input("ID_Usuario", sql.Int, ID_Usuario)
                .input('ID_Asociado', sql.Int, null) // Mandar como null
                .input("ID_Tipo_Contratacion", sql.VarChar, ID_Tipo_Contratacion)
                .input("estado", sql.VarChar, 'revision')
                .input("AmbulanciaID", sql.Int, ambulanciaSeleccionada)
                .query(`
                    INSERT INTO tbl_Contratacion_Ambulancia (
                        nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo,
                        material_especifico, fecha, horario, ID_Usuario, ID_Asociado, ID_Tipo_Contratacion, estado, AmbulanciaID
                    )
                    VALUES (
                        @nombre, @apellido_Paterno, @apellido_Materno, @inicio_Traslado, @escala, @destino_Traslado, @motivo,
                        @material_especifico, @fecha, @horario, @ID_Usuario, @ID_Asociado, @ID_Tipo_Contratacion, @estado, @AmbulanciaID
                    );
                    SELECT SCOPE_IDENTITY() AS ID_Contratacion;
                `);

            console.log('result:', result);

            if (result.recordset && result.recordset.length > 0) {
                const newContractId = result.recordset[0].ID_Contratacion;

                // Actualizar el campo horario a tipo time
                await pool.request()
                    .input("ID_Contratacion", sql.Int, newContractId)
                    .query("UPDATE tbl_Contratacion_Ambulancia SET horario = CAST(horario AS time) WHERE ID_Contratacion = @ID_Contratacion");

                // Actualizar el estado de la ambulancia a 'ocupada'
                await pool.request()
                    .input("AmbulanciaID", sql.Int, ambulanciaSeleccionada)
                    .query("UPDATE Ambulancias SET EstadoActual = 'Ocupada' WHERE AmbulanciaID = @AmbulanciaID");

                return res.json({ msg: "Contratación registrada correctamente", estado: 'revision' });
            } else {
                return res.status(500).json({ msg: "Error al registrar la contratación" });
            }
        }
    } catch (error) {
        console.error('Error al crear la contratación:', error); // Agregar logueo del error
        res.status(500).json({ error: error.message });
    }
};




exports.getUserByEmailContratacionAm = async (req, res) => {
    const { correo } = req.params;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query(querys.getUserByEmail);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ msg: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
        res.status(500).json({ error: error.message });
    }
};




exports.enviarCorreoContratacion = async (req, res) => {
    const { nombre, apellido_Paterno, apellido_Materno, correo } = req.body;

    // Verificar si todos los campos están presentes
    if (!nombre || !apellido_Paterno || !apellido_Materno || !correo) {
        return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }

    try {
        // Configurar transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cruzrojasuport@gmail.com',
                pass: 'onopzodxqxheqwnz'
            }
        });

        // Configurar opciones del correo
        const mailOptions = {
            from: 'cruzrojasuport@gmail.com',
            to: correo,
            subject: 'Confirmación de Registro de Contratación de Ambulancia',
            html: `
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f2f2f2;
                  margin: 0;
                  padding: 0;
                }
                .banner {
                  background-color: #ff0000;
                  color: #fff;
                  padding: 10px;
                  text-align: center;
                }
                .container {
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  background-color: #fff;
                  border-radius: 10px;
                  box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="banner">
                <h2>Registro de Contratación de Ambulancia - Cruz Roja</h2>
              </div>
              <div class="container">
                <p>Estimado/a ${nombre} ${apellido_Paterno} ${apellido_Materno},</p>
                <p>Su solicitud ha sido registrada exitosamente y pasará por un proceso de revisión.</p>
                <p>Nos pondremos en contacto con usted para informarle si su solicitud ha sido aceptada o rechazada.</p>
                <p>En caso de ser rechazada, se le proporcionará el motivo correspondiente. Si es aceptada, recibirá las indicaciones necesarias y el precio que deberá pagar a la Cruz Roja.</p>
                <p>Gracias por confiar en nosotros.</p>
              </div>
              <div class="footer">
                <p>Atentamente,</p>
                <p>El equipo de Cruz Roja</p>
              </div>
            </body>
            </html>`
        };

        // Enviar correo electrónico
        await transporter.sendMail(mailOptions);
        res.json({ msg: 'Correo enviado correctamente' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ msg: 'Error al enviar el correo', error: error.message });
    }
};



exports.getAmbulanciaById = async (req, res) => {
    const { AmbulanciaID } = req.params; // Ajuste aquí para que coincida con la ruta
    console.log("ID_Ambulancia recibido:", AmbulanciaID); // Verifica que el ID se está recibiendo correctamente
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('AmbulanciaID', sql.Int, AmbulanciaID) // Usa el nombre correcto del parámetro aquí
            .query('SELECT * FROM Ambulancias WHERE AmbulanciaID = @AmbulanciaID'); // Asegúrate de que la columna coincida con la base de datos
        console.log("Resultado de la consulta:", result); // Verifica el resultado de la consulta
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: "Ambulancia no encontrada" });
        }
    } catch (error) {
        console.error("Error al obtener los datos de la ambulancia por ID:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};



exports.getTipoContratacionById = async (req, res) => {
    const { ID_Tipo_Contratacion } = req.params;
    console.log("ID_Tipo_Contratacion:", ID_Tipo_Contratacion);
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('ID_Tipo_Contratacion', sql.VarChar, ID_Tipo_Contratacion)
            .query(`SELECT * FROM tbl_Tipo_Contratacion 
                    WHERE ID_Tipo_Contratacion = @ID_Tipo_Contratacion
            `);
        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener los datos del tipo de contratación por ID:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};




exports.getServiciosExcluidos = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`SELECT * FROM tbl_Servicios 
                    WHERE tipo_Servicio NOT IN ('Traslados', 'Eventos')`);
        
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener los datos de los servicios excluyendo Traslados y Eventos:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};




//--------------------------------------------Perfil------------------------------------

exports.getContratacionById = async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      return res.status(400).json({ msg: 'ID de usuario es requerido' });
    }
  
    try {
      const pool = await getConnection();
      if (!pool) {
        throw new Error("No se pudo establecer la conexión con la base de datos");
      }
  
      const result = await pool.request()
        .input("ID_Usuario", sql.Int, parseInt(userId))
        .query(`
          SELECT *
          FROM tbl_Contratacion_Ambulancia
          WHERE ID_Usuario = @ID_Usuario
            AND (estado = 'Revision' OR estado = 'revision')
        `);
  
      if (result.recordset.length === 0) {
        return res.json([]); // Devuelve un array vacío en lugar de un objeto con un mensaje
      } else {
        const formattedResults = result.recordset.map(contratacion => {
          console.log("Fecha original:", contratacion.fecha);
          console.log("Horario original:", contratacion.horario);
  
          // Procesar la fecha
          const fechaOriginal = new Date(contratacion.fecha);
          const fechaMexico = new Date(fechaOriginal.getTime() + fechaOriginal.getTimezoneOffset() * 60000);
          const fechaFormateada = fechaMexico.toISOString().split('T')[0];
  
          // Procesar la hora
          const horaOriginal = new Date(contratacion.horario);
          const horaFormateada = `${String(horaOriginal.getUTCHours()).padStart(2, '0')}:${String(horaOriginal.getUTCMinutes()).padStart(2, '0')}`;
  
          console.log("Fecha extraída:", fechaFormateada);
          console.log("Hora extraída:", horaFormateada);
  
          // Combinar fecha y hora
          const fechaHoraCombinada = `${fechaFormateada}T${horaFormateada}`;
  
          // Crear un objeto moment en la zona horaria de México
          const contratacionMoment = moment.tz(fechaHoraCombinada, 'America/Mexico_City');
  
          console.log("Fecha y hora en México:", contratacionMoment.format('YYYY-MM-DD hh:mm A'));
  
          return {
            ...contratacion,
            fecha: contratacionMoment.format('DD/MM/YYYY'),
            horario: contratacionMoment.format('hh:mm A')
          };
        });
        return res.json(formattedResults);
      }
    } catch (error) {
      console.error('Error al obtener las contrataciones del usuario:', error);
      res.status(500).json({ error: 'Error al obtener las contrataciones del usuario' });
    }
  };
  
  
  exports.updateFechaContratacionAmbulanciaById = async (req, res) => {
      const { fecha, horario} = req.body;
      const { ID_Contratacion } = req.params;
    
      if (!fecha || !horario ) {
        return res.status(400).json({ msg: "Por favor llene todos los campos" });
      }
    
      try {
        const pool = await getConnection();
        if (!pool) {
          throw new Error("No se pudo establecer la conexión con la base de datos");
        }
    
        // Obtener la fecha actual en la zona horaria de México
        const today = moment().tz('America/Mexico_City').startOf('day');
        const now = moment().tz('America/Mexico_City');
    
        // Convertir la fecha de entrada a la fecha en la zona horaria de México
        const inputDate = moment.tz(fecha, 'YYYY-MM-DD', 'America/Mexico_City').startOf('day');
    
        console.log('Fecha actual (local):', today.format());
        console.log('Fecha de entrada (local):', inputDate.format());
    
        if (inputDate.isBefore(today)) {
          console.log("La fecha de la contratación no puede ser anterior a hoy");
          return res.status(400).json({ msg: "La fecha de la contratación no puede ser anterior a hoy" });
        }
    
        // Asegurar que el horario esté en formato correcto HH:mm:ss
        const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!horarioRegex.test(horario)) {
          console.log("El formato de la hora es inválido. Use HH:mm:ss");
          return res.status(400).json({ msg: "El formato de la hora es inválido. Use HH:mm:ss" });
        }
    
        // Convertir el horario a un objeto moment en la zona horaria de México
        const inputDateTime = moment.tz(`${fecha} ${horario}`, 'YYYY-MM-DD HH:mm:ss', 'America/Mexico_City');
    
        // Verificar si la contratación es para hoy y la hora ya ha pasado
        if (inputDate.isSame(today) && inputDateTime.isBefore(now)) {
          console.log("No puede agendar una contratación en una hora que ya ha pasado hoy");
          return res.status(400).json({ msg: "No puede agendar una contratación en una hora que ya ha pasado hoy" });
        }
    
        // Verificar que no exista una contratación en la misma fecha y hora
        console.log("Verificando contrataciones duplicadas...");
        const result = await pool.request()
          .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
          .input("horario", sql.VarChar, horario)
          .input("ID_Contratacion", sql.Int, ID_Contratacion) // Asegúrate de pasar @ID_Contratacion aquí también
          .query("SELECT * FROM tbl_Contratacion_Ambulancia WHERE fecha = @fecha AND CAST(horario AS TIME) = CAST(@horario AS TIME) AND ID_Contratacion != @ID_Contratacion");
    
        console.log("Resultados de verificación de contrataciones duplicadas:", result.recordset);
    
        if (result.recordset.length > 0) {
          console.log("Ya existe una contratación en esta fecha y hora");
          return res.status(400).json({ msg: "Ya existe una contratación en esta fecha y hora" });
        }
    
        // Actualizar la contratación en la base de datos
        console.log("Actualizando la contratación...");
        await pool.request()
          .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
          .input("horario", sql.VarChar, horario)
          .input("ID_Contratacion", sql.Int, ID_Contratacion) // Asegúrate de pasar @ID_Contratacion aquí también
          .query('UPDATE tbl_Contratacion_Ambulancia SET fecha = @fecha, horario = CAST(@horario AS TIME) WHERE ID_Contratacion = @ID_Contratacion');
    
        console.log("Contratación actualizada exitosamente");
        res.json({ msg: "Contratación actualizada exitosamente" });
      } catch (error) {
        console.error("Error en la actualización de la contratación:", error.message); // Añadir logs
        res.status(500).json({ msg: "Error al actualizar la contratación", error: error.message });
      }
  };
  
  exports.updateCancelarContratacionById = async (req, res) => {
    const { estado } = req.body;
    const { ID_Contratacion } = req.params;
  
    if (!estado) {
      return res.status(400).json({ msg: "Por favor llene todos los campos" });
    }
  
    try {
      const pool = await getConnection();
      if (!pool) {
        throw new Error("No se pudo establecer la conexión con la base de datos");
      }
  
      await pool.request()
        .input("estado", sql.VarChar, estado)
        .input("ID_Contratacion", sql.Int, ID_Contratacion)
        .query(`
          UPDATE tbl_Contratacion_Ambulancia
          SET estado = @estado
          WHERE ID_Contratacion = @ID_Contratacion
        `);
  
      // Actualizar el estado de la ambulancia a 'Disponible'
      await pool.request()
        .input("ID_Contratacion", sql.Int, ID_Contratacion)
        .query(`
          UPDATE Ambulancias
          SET EstadoActual = 'Disponible'
          WHERE AmbulanciaID = (SELECT AmbulanciaID FROM tbl_Contratacion_Ambulancia WHERE ID_Contratacion = @ID_Contratacion)
        `);
  
      res.json({ msg: "Contratación cancelada exitosamente", estado });
    } catch (error) {
      console.error("Error al cancelar la contratación:", error.message);
      res.status(500).json({ msg: "Error al cancelar la contratación", error: error.message });
    }
  };

  //--------------------------------- Promedio de los tipos de contrataciones----------------

  exports.getContractationCategoryAverages = async (req, res) => {
    try {
      // Conexión a la base de datos
      const pool = await getConnection();

      // Consulta SQL para contar las contrataciones por tipo (ID_Tipo_Contratacion)
      const result = await pool.request().query(`
          SELECT 
              ID_Tipo_Contratacion,
              COUNT(*) AS total_contrataciones
          FROM tbl_Contratacion_Ambulancia
          GROUP BY ID_Tipo_Contratacion
      `);

      // Crear un objeto para mapear los ID de tipo de contratación con sus nombres y conteos
      const contractCounts = result.recordset.reduce((acc, row) => {
          acc[row.ID_Tipo_Contratacion] = row.total_contrataciones;
          return acc;
      }, {});

      // Total de contrataciones registradas
      const totalContrataciones = Object.values(contractCounts).reduce((sum, count) => sum + count, 0);

      // Crear el objeto con los promedios por tipo de contratación
      const averages = {
          "Eventos": ((contractCounts['EVEN'] || 0) / totalContrataciones * 100).toFixed(1),
          "Traslados": ((contractCounts['TRAS'] || 0) / totalContrataciones * 100).toFixed(1),
      };

      // Enviar la respuesta en formato JSON
      res.json({ averages });
    } catch (error) {
        // Manejo de errores
        res.status(500).send(error.message);
    }
  };
  