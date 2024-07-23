const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');


exports.getCitas = async (req, res)=> {
   try {
    const pool = await getConnection()
    const result= await pool.request().query(querys.getCitas)
    res.json(result.recordset)
   } catch (error) {
    res.status(500);
    res.send(error.message);
   }
};

exports.updateCitasById = async (req, res) => {

   const {estado} = req.body;
 
   const {ID_Cita}=req.params
   
     // Verificar si todos los campos están presentes
   if (estado == null ) {
     return res.status(400).json({ msg: "Por favor llene todos los campos" });
   }
 
     //const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
     const pool = await getConnection();
     await pool.request()
       .input("estado", sql.VarChar, estado)
       .input("ID_Cita", sql.Int, ID_Cita)
       // Usa la contraseña cifrada
       .query(querys.updateCitasById);
 
     // Enviar respuesta de éxito
     res.json({estado});
   
 };

 exports.createNewCitas = async (req, res) => {
  const { nombre, apellido_Paterno, apellido_Materno, fecha, horario, ID_Servicio, correo } = req.body;

  if (!nombre || !apellido_Paterno || !apellido_Materno || !fecha || !horario || !ID_Servicio || !correo) {
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
      return res.status(400).json({ msg: "La fecha de la cita no puede ser anterior a hoy" });
    }

    // Asegurar que el horario esté en formato correcto HH:mm:ss
    const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!horarioRegex.test(horario)) {
      return res.status(400).json({ msg: "El formato de la hora es inválido. Use HH:mm:ss" });
    }

    // Convertir el horario a un objeto moment en la zona horaria de México
    const inputDateTime = moment.tz(`${fecha} ${horario}`, 'YYYY-MM-DD HH:mm:ss', 'America/Mexico_City');

    // Verificar si la cita es para hoy y la hora ya ha pasado
    if (inputDate.isSame(today) && inputDateTime.isBefore(now)) {
      return res.status(400).json({ msg: "No puede agendar una cita en una hora que ya ha pasado hoy" });
    }

    // Verificar que no exista una cita en la misma fecha y hora
    const result = await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .query("SELECT * FROM tbl_Citas WHERE fecha = @fecha AND CAST(horario AS TIME) = CAST(@horario AS TIME)");

    if (result.recordset.length > 0) {
      return res.status(400).json({ msg: "Ya existe una cita en esta fecha y hora" });
    }

    // Insertar la cita en la base de datos
    await pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
      .input("apellido_Materno", sql.VarChar, apellido_Materno)
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .input("ID_Servicio", sql.VarChar, ID_Servicio)
      .input("correo", sql.VarChar, correo)
      .query(`
        INSERT INTO tbl_Citas (nombre, apellido_Paterno, apellido_Materno, fecha, horario, estado, Id_Cargo, ID_Servicio, correo)
        VALUES (@nombre, @apellido_Paterno, @apellido_Materno, @fecha, CAST(@horario AS TIME), 'Pendiente', 'UNC', @ID_Servicio, @correo)
      `);

    res.json({ nombre, apellido_Paterno, apellido_Materno, fecha, horario, ID_Servicio, correo });
  } catch (error) {
    console.error("Error en createNewCitas:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};





exports.getCitasHoy = async (req, res) => {
  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    // Obtener la fecha y hora actual en la zona horaria de México
    const currentDateTimeMexico = moment().tz('America/Mexico_City');
    const currentDateString = currentDateTimeMexico.format('YYYY-MM-DD'); // Formato YYYY-MM-DD
    const currentTimeString = currentDateTimeMexico.format('HH:mm:ss'); // Formato HH:mm:ss

    console.log("Fecha actual (México):", currentDateString);
    console.log("Hora actual (México):", currentTimeString);

    const result = await pool.request()
      .query(`
        SELECT *
        FROM tbl_Citas
        WHERE CAST(fecha AS DATE) = '${currentDateString}'
          AND CAST(horario AS TIME) >= '${currentTimeString}'
          AND estado = 'Pendiente'
        ORDER BY horario
      `);

    // Imprimir los resultados para depuración
    console.log("Resultados de la consulta:", result.recordset);

    // Verificar si hay resultados
    if (result.recordset.length === 0) {
      res.json({ message: "No hay citas para hoy" });
    } else {
      res.json(result.recordset);
    }
  } catch (error) {
    console.error("Error al obtener las citas de hoy:", error);
    res.status(500).json({ error: error.message }); // Solo envía el mensaje de error
  }
};







// Función para convertir horas a formato HH:MM:SS
const convertToHHMMSS = (time) => {
  // Dividir la cadena de tiempo en partes usando ':'
  const parts = time.split(':');

  // Si solo se proporciona la hora, completamos con minutos y segundos en cero
  let hour = parseInt(parts[0], 10) || 0;
  let minute = parseInt(parts[1], 10) || 0;
  let second = parseInt(parts[2], 10) || 0;

  // Si falta alguno de los valores, los establecemos como cero
  if (isNaN(hour)) {
    throw new Error("Formato de hora no válido. Use HH:MM:SS.");
  }

  // Aseguramos que cada parte tenga dos dígitos
  hour = hour.toString().padStart(2, '0');
  minute = minute.toString().padStart(2, '0');
  second = second.toString().padStart(2, '0');

  return `${hour}:${minute}:${second}`;
};


exports.getCitasHoyPorRango = async (req, res) => {
  let { horaInicio, horaFin } = req.query;

  if (!horaInicio || !horaFin) {
    return res.status(400).json({ msg: "Por favor proporcione una hora de inicio y una hora de fin" });
  }

  try {
    // Validar que las horas tengan el formato correcto HH:MM:SS
    const timeFormat = /^\d{2}:\d{2}:\d{2}$/;
    if (!timeFormat.test(horaInicio)) {
      horaInicio = convertToHHMMSS(horaInicio);
    }
    if (!timeFormat.test(horaFin)) {
      horaFin = convertToHHMMSS(horaFin);
    }

    if (!timeFormat.test(horaInicio) || !timeFormat.test(horaFin)) {
      return res.status(400).json({ msg: "Formato de hora no válido. Use HH:MM:SS." });
    }

    // Obtener la fecha actual y hora actual en la zona horaria de México
    const currentDate = moment().tz('America/Mexico_City').format('YYYY-MM-DD');
    const currentTime = moment().tz('America/Mexico_City').format('HH:mm:ss');

    // Log para depurar
    console.log('Fecha actual (local):', currentDate);
    console.log('Hora actual (local):', currentTime);
    console.log('Hora Inicio:', horaInicio);
    console.log('Hora Fin:', horaFin);

    const pool = await getConnection(); // Función para obtener la conexión a la base de datos
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const request = pool.request();
    request.input('currentDate', sql.Date, currentDate);
    request.input('horaInicio', sql.VarChar, horaInicio); // Usar VarChar para el formato de hora
    request.input('horaFin', sql.VarChar, horaFin);       // Usar VarChar para el formato de hora
    request.input('currentTime', sql.VarChar, currentTime);

    const result = await request.query(`
      SELECT * FROM tbl_Citas
      WHERE CAST(fecha AS DATE) = @currentDate
      AND horario >= @horaInicio AND horario <= @horaFin
      AND horario >= @currentTime
      AND estado != 'Atendida'
      ORDER BY horario
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener las citas por rango de horas:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};


exports.getCitasLimitadas = async (req, res) => {
  const { limite } = req.query;

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const result = await pool.request()
      .input('limite', sql.Int, parseInt(limite))
      .query(`
        SELECT TOP (@limite) * FROM tbl_Citas
        WHERE CAST(fecha AS DATE) >= CAST(GETDATE() AS DATE)
        ORDER BY fecha, horario
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener las citas limitadas:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.getCitasPorFecha = async (req, res) => {
  const { fecha } = req.query;

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const result = await pool.request()
      .input('fecha', sql.Date, new Date(fecha))
      .query(`
        SELECT * FROM tbl_Citas
        WHERE CAST(fecha AS DATE) = @fecha
        ORDER BY horario
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener las citas por fecha:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};


exports.getCitasPorFechaYRango = async (req, res) => {
  const { fecha, horaInicio, horaFin } = req.query;

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const result = await pool.request()
      .input('fecha', sql.Date, new Date(fecha))
      .input('horaInicio', sql.Time, horaInicio)
      .input('horaFin', sql.Time, horaFin)
      .query(`
        SELECT * FROM tbl_Citas
        WHERE CAST(fecha AS DATE) = @fecha
        AND horario >= @horaInicio AND horario <= @horaFin
        ORDER BY horario
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener las citas por fecha y rango de horas:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};


exports.getCitaPorId = async (req, res) => {
  const { idCita } = req.params;

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const result = await pool.request()
      .input('idCita', sql.Int, parseInt(idCita))
      .query(`
        SELECT * FROM tbl_Citas
        WHERE ID_Cita = @idCita
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ msg: "Cita no encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener la cita por ID:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};





exports.getCitasPorCorreo = async (req, res) => {
  const { correo } = req.query;

  if (!correo) {
    return res.status(400).json({ msg: "Por favor proporcione un correo" });
  }

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const currentDateTimeMexico = moment().tz('America/Mexico_City');
    const currentDateString = currentDateTimeMexico.format('YYYY-MM-DD');
    const currentTimeString = currentDateTimeMexico.format('HH:mm:ss');

    console.log("Fecha actual (México):", currentDateString);
    console.log("Hora actual (México):", currentTimeString);

    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query(`
        SELECT *
        FROM tbl_Citas
        WHERE correo = @correo
          AND (CAST(fecha AS DATE) > '${currentDateString}'
          OR (CAST(fecha AS DATE) = '${currentDateString}' AND CAST(horario AS TIME) >= '${currentTimeString}'))
          AND estado = 'Pendiente'
        ORDER BY fecha, horario
      `);

    console.log("Resultados de la consulta:", result.recordset);

    if (result.recordset.length === 0) {
      return res.json({ message: "No hay citas para el correo proporcionado" });
    } else {
      const formattedResults = result.recordset.map(cita => {
        console.log("Fecha original:", cita.fecha);
        console.log("Horario original:", cita.horario);

        // Procesar la fecha
        const fechaOriginal = new Date(cita.fecha);
        const fechaMexico = new Date(fechaOriginal.getTime() + fechaOriginal.getTimezoneOffset() * 60000);
        const fechaFormateada = fechaMexico.toISOString().split('T')[0];

        // Procesar la hora
        const horaOriginal = new Date(cita.horario);
        const horaFormateada = `${String(horaOriginal.getUTCHours()).padStart(2, '0')}:${String(horaOriginal.getUTCMinutes()).padStart(2, '0')}`;

        console.log("Fecha extraída:", fechaFormateada);
        console.log("Hora extraída:", horaFormateada);

        // Combinar fecha y hora
        const fechaHoraCombinada = `${fechaFormateada}T${horaFormateada}`;

        // Crear un objeto moment en la zona horaria de México
        const citaMoment = moment.tz(fechaHoraCombinada, 'America/Mexico_City');

        console.log("Fecha y hora en México:", citaMoment.format('YYYY-MM-DD hh:mm A'));

        return {
          ...cita,
          fecha: citaMoment.format('DD/MM/YYYY'),
          horario: citaMoment.format('hh:mm A')
        };
      });
      return res.json(formattedResults);
    }
  } catch (error) {
    console.error("Error al obtener las citas por correo:", error);
    return res.status(500).json({ error: error.message });
  }
};