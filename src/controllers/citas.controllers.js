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
      .query("SELECT estado FROM tbl_Citas WHERE fecha = @fecha AND CAST(horario AS TIME) = CAST(@horario AS TIME)");

    // Permitir el registro de la cita solo si no existen citas con estado distinto de 'Cancelado'
    const citasConflictivas = result.recordset.filter(cita => cita.estado !== 'Cancelado');
    if (citasConflictivas.length > 0) {
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


      const servicioResult = await pool.request()
      .input("ID_Servicio", sql.VarChar, ID_Servicio)
      .query("SELECT tipo_Servicio, indicaciones_previas FROM tbl_Servicios WHERE ID_Servicio = @ID_Servicio");

    if (servicioResult.recordset.length === 0) {
      return res.status(400).json({ msg: "El servicio no existe" });
    }

    const { tipo_Servicio, indicaciones_previas } = servicioResult.recordset[0];



    res.json({ nombre, apellido_Paterno, apellido_Materno, fecha, horario, ID_Servicio, correo });

    await enviarCorreoCita({ nombre, apellido_Paterno, apellido_Materno, fecha, horario, tipo_Servicio, indicaciones_previas, correo });
  } catch (error) {
    console.error("Error en createNewCitas:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};



const enviarCorreoCita = async ({ nombre, apellido_Paterno, apellido_Materno, fecha, horario, tipo_Servicio, indicaciones_previas, correo }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cruzrojasuport@gmail.com',
        pass: 'onopzodxqxheqwnz'
      }
    });

    const mailOptions = {
      from: 'cruzrojasuport@gmail.com',
      to: correo,
      subject: 'Confirmación de Registro de Cita',
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
            <h2>Registro de Cita - Cruz Roja</h2>
          </div>
          <div class="container">
            <p>Estimado/a ${nombre} ${apellido_Paterno} ${apellido_Materno},</p>
            <p>Su cita ha sido registrada exitosamente.</p>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Horario:</strong> ${horario}</p>
            <p><strong>Servicio:</strong> ${tipo_Servicio}</p>
            <p><strong>Indicaciones Previas:</strong> ${indicaciones_previas}</p>
            <p>Gracias por confiar en nosotros.</p>
          </div>
          <div class="footer">
            <p>Atentamente,</p>
            <p>El equipo de Cruz Roja</p>
          </div>
        </body>
        </html>`
    };

    await transporter.sendMail(mailOptions);
    console.log('Correo enviado correctamente');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
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






exports.getHorasDisponiblesPorFecha = async (req, res) => {
  const { fecha } = req.params;

  // Convert the date to the correct timezone and format
  const dateInMexico = moment.tz(fecha, 'America/Mexico_City').format('M/D/YYYY');
  console.log(dateInMexico);

  const horarios = [
    { id: 1, name: '08:00 AM', time: '08:00:00' },
    { id: 2, name: '08:30 AM', time: '08:30:00' },
    { id: 3, name: '09:00 AM', time: '09:00:00' },
    { id: 4, name: '09:30 AM', time: '09:30:00' },
    { id: 5, name: '10:00 AM', time: '10:00:00' },
    { id: 6, name: '10:30 AM', time: '10:30:00' },
    { id: 7, name: '11:00 AM', time: '11:00:00' },
    { id: 8, name: '11:30 AM', time: '11:30:00' },
    { id: 9, name: '12:00 PM', time: '12:00:00' },
    { id: 10, name: '12:30 PM', time: '12:30:00' },
    { id: 11, name: '01:00 PM', time: '13:00:00' },
    { id: 12, name: '01:30 PM', time: '13:30:00' },
    { id: 13, name: '02:00 PM', time: '14:00:00' },
    { id: 14, name: '02:30 PM', time: '14:30:00' },
    { id: 15, name: '03:00 PM', time: '15:00:00' },
    { id: 16, name: '03:30 PM', time: '15:30:00' },
    { id: 17, name: '04:00 PM', time: '16:00:00' },
    { id: 18, name: '04:30 PM', time: '16:30:00' },
  ];

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const result = await pool.request()
      .input('fecha', sql.VarChar, dateInMexico)
      .query(`
        SELECT horario FROM tbl_Citas
        WHERE fecha = @fecha AND estado = 'Pendiente'
      `);

    // Extraer solo la parte de la hora en formato 'HH:mm:ss'
    const horariosOcupados = result.recordset.map(record => {
      const time = new Date(record.horario).toISOString().substr(11, 8);
      return time;
    });
    console.log(horariosOcupados);

    const horariosDisponibles = horarios.filter(horario => !horariosOcupados.includes(horario.time));
    console.log(horariosDisponibles);

    res.json(horariosDisponibles);
  } catch (error) {
    console.error("Error al obtener las horas disponibles por fecha:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};



exports.createNewCitasUsuario = async (req, res) => {
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

    // Verificar que no exista una cita en la misma fecha y hora con estado "pendiente"
    const result = await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .query("SELECT * FROM tbl_Citas WHERE fecha = @fecha AND CAST(horario AS TIME) = CAST(@horario AS TIME)");

    if (result.recordset.length > 0) {
      const citaExistente = result.recordset[0];
      if (citaExistente.estado === "Pendiente") {
        return res.status(400).json({ msg: "Ya existe una cita para esa fecha y hora con estado 'pendiente'" });
      } else if (citaExistente.estado === "Cancelado") {
        // Actualizar la cita cancelada con los nuevos datos
        await pool.request()
          .input("nombre", sql.VarChar, nombre)
          .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
          .input("apellido_Materno", sql.VarChar, apellido_Materno)
          .input("ID_Servicio", sql.VarChar, ID_Servicio)
          .input("correo", sql.VarChar, correo)
          .input("ID_Cita", sql.Int, citaExistente.ID_Cita)
          .query(`
            UPDATE tbl_Citas
            SET nombre = @nombre,
                apellido_Paterno = @apellido_Paterno,
                apellido_Materno = @apellido_Materno,
                estado = 'Pendiente',
                ID_Servicio = @ID_Servicio,
                correo = @correo
            WHERE ID_Cita = @ID_Cita
          `);
        return res.json({ msg: "La cita cancelada ha sido actualizada y está ahora en estado 'pendiente'" });
      }
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
        VALUES (@nombre, @apellido_Paterno, @apellido_Materno, @fecha, CAST(@horario AS TIME), 'Pendiente', 'UNL', @ID_Servicio, @correo)
      `);

    res.json({ msg: "Cita creada exitosamente", nombre, apellido_Paterno, apellido_Materno, fecha, horario, ID_Servicio, correo });
  } catch (error) {
    console.error("Error en createNewCitasUsuario:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.updateFechaCitaById2AnteriorCarlos = async (req, res) => {
  const { fecha, horario, ID_Servicio } = req.body;
  const { ID_Cita } = req.params;

  if (!fecha || !horario || !ID_Servicio ) {
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
      console.log("La fecha de la cita no puede ser anterior a hoy");
      return res.status(400).json({ msg: "La fecha de la cita no puede ser anterior a hoy" });
    }

    // Asegurar que el horario esté en formato correcto HH:mm:ss
    const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!horarioRegex.test(horario)) {
      console.log("El formato de la hora es inválido. Use HH:mm:ss");
      return res.status(400).json({ msg: "El formato de la hora es inválido. Use HH:mm:ss" });
    }

    // Convertir el horario a un objeto moment en la zona horaria de México
    const inputDateTime = moment.tz(`${fecha} ${horario}`, 'YYYY-MM-DD HH:mm:ss', 'America/Mexico_City');

    // Verificar si la cita es para hoy y la hora ya ha pasado
    if (inputDate.isSame(today) && inputDateTime.isBefore(now)) {
      console.log("No puede agendar una cita en una hora que ya ha pasado hoy");
      return res.status(400).json({ msg: "No puede agendar una cita en una hora que ya ha pasado hoy" });
    }

    // Verificar que no exista una cita en la misma fecha y hora
    console.log("Verificando citas duplicadas...");
    const result = await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .input("ID_Cita", sql.Int, ID_Cita) // Asegúrate de pasar @ID_Cita aquí también
      .query("SELECT * FROM tbl_Citas WHERE fecha = @fecha AND CAST(horario AS TIME) = CAST(@horario AS TIME) AND ID_Cita != @ID_Cita");

    console.log("Resultados de verificación de citas duplicadas:", result.recordset);

    if (result.recordset.length > 0) {
      console.log("Ya existe una cita en esta fecha y hora");
      return res.status(400).json({ msg: "Ya existe una cita en esta fecha y hora" });
    }

    // Actualizar la cita en la base de datos
    console.log("Actualizando la cita...");
    await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .input("ID_Servicio", sql.Int, ID_Servicio)
      .input("ID_Cita", sql.Int, ID_Cita) // Asegúrate de pasar @ID_Cita aquí también
      .query('UPDATE tbl_Citas SET fecha = @fecha, horario = CAST(@horario AS TIME), ID_Servicio = @ID_Servicio WHERE ID_Cita = @ID_Cita');

    console.log("Cita actualizada exitosamente");
    res.json({ msg: "Cita actualizada exitosamente" });
  } catch (error) {
    console.error("Error en la actualización de la cita:", error.message); // Añadir logs
    res.status(500).json({ msg: "Error al actualizar la cita", error: error.message });
  }
};

exports.updateFechaCitaById = async (req, res) => {
  const { fecha, horario, ID_Servicio } = req.body;
  const { ID_Cita } = req.params;

  if (!fecha || !horario || !ID_Servicio) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

  try {
    const pool = await getConnection();
    if (!pool) {
      throw new Error("No se pudo establecer la conexión con la base de datos");
    }

    const today = moment().tz('America/Mexico_City').startOf('day');
    const now = moment().tz('America/Mexico_City');
    const inputDate = moment.tz(fecha, 'YYYY-MM-DD', 'America/Mexico_City').startOf('day');

    if (inputDate.isBefore(today)) {
      return res.status(400).json({ msg: "La fecha de la cita no puede ser anterior a hoy" });
    }

    const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!horarioRegex.test(horario)) {
      return res.status(400).json({ msg: "El formato de la hora es inválido. Use HH:mm:ss" });
    }

    const inputDateTime = moment.tz(`${fecha} ${horario}`, 'YYYY-MM-DD HH:mm:ss', 'America/Mexico_City');
    if (inputDate.isSame(today) && inputDateTime.isBefore(now)) {
      return res.status(400).json({ msg: "No puede agendar una cita en una hora que ya ha pasado hoy" });
    }

    // Obtener el correo de la cita actual para la validación
    const citaActual = await pool.request()
      .input("ID_Cita", sql.Int, ID_Cita)
      .query("SELECT correo FROM tbl_Citas WHERE ID_Cita = @ID_Cita");

    if (citaActual.recordset.length === 0) {
      return res.status(404).json({ msg: "Cita no encontrada" });
    }

    const { correo } = citaActual.recordset[0];

    // Verificar si ya existe una cita en la misma fecha y hora (con estado distinto de "Cancelado")
    const result = await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .input("ID_Cita", sql.Int, ID_Cita)
      .query(`SELECT * FROM tbl_Citas 
              WHERE fecha = @fecha 
              AND CAST(horario AS TIME) = CAST(@horario AS TIME) 
              AND ID_Cita != @ID_Cita
              AND estado != 'Cancelado'`);

    const citaDuplicada = result.recordset[0];

    if (citaDuplicada) {
      return res.status(400).json({ msg: "Ya existe una cita en esta fecha y hora con estado activo" });
    }

    // Permitir actualización para la misma fecha pero con diferente hora o servicio, si el correo coincide
    const resultSameDate = await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("ID_Cita", sql.Int, ID_Cita)
      .input("correo", sql.VarChar, correo)
      .query(`SELECT * FROM tbl_Citas 
              WHERE fecha = @fecha 
              AND ID_Cita != @ID_Cita 
              AND correo != @correo 
              AND estado != 'Cancelado'`);

    if (resultSameDate.recordset.length > 0) {
      return res.status(400).json({ msg: "No puede actualizar la cita, ya hay una cita reservada para esta fecha con un correo diferente" });
    }

    // Actualizar la cita en la base de datos
    await pool.request()
      .input("fecha", sql.Date, inputDate.format('YYYY-MM-DD'))
      .input("horario", sql.VarChar, horario)
      .input("ID_Servicio", sql.Int, ID_Servicio)
      .input("ID_Cita", sql.Int, ID_Cita)
      .query('UPDATE tbl_Citas SET fecha = @fecha, horario = CAST(@horario AS TIME), ID_Servicio = @ID_Servicio WHERE ID_Cita = @ID_Cita');

    res.json({ msg: "Cita actualizada exitosamente" });
  } catch (error) {
    console.error("Error en la actualización de la cita:", error.message);
    res.status(500).json({ msg: "Error al actualizar la cita", error: error.message });
  }
};




exports.updateCancelarCitaById = async (req, res) => {
  const { estado } = req.body;
  const { ID_Cita } = req.params;

  if (!estado) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input("estado", sql.VarChar, estado)
      .input("ID_Cita", sql.Int, ID_Cita)
      .query(querys.updateCancelarCitaById);

    res.json({ msg: "Cita cancelada exitosamente", estado });
  } catch (error) {
    res.status(500).json({ msg: "Error al cancelar la cita", error: error.message });
  }
};



exports.getCitasPorCorreoPagina = async (req, res) => {
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
        SELECT c.*, ts.tipo_Servicio
        FROM tbl_Citas c
        JOIN tbl_Servicios ts ON c.ID_Servicio = ts.ID_Servicio
        WHERE c.correo = @correo
          AND (
            CAST(c.fecha AS DATE) > '${currentDateString}'
            OR (CAST(c.fecha AS DATE) = '${currentDateString}' AND CAST(c.horario AS TIME) >= '${currentTimeString}')
          )
          AND c.estado = 'Pendiente'
        ORDER BY c.fecha, c.horario
      `);

    console.log("Resultados de la consulta:", result.recordset);

    if (result.recordset.length === 0) {
      return res.json([]);  // Devuelve un arreglo vacío si no hay citas
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
          horario: citaMoment.format('hh:mm A'),
          tipo_Servicio: cita.tipo_Servicio // Añadir tipo_Servicio al resultado
        };
      });
      return res.json(formattedResults);
    }
  } catch (error) {
    console.error("Error al obtener las citas por correo:", error);
    return res.status(500).json({ error: error.message });
  }
};


exports.getTipoServicios = async (req, res)=> {
  try {
   const pool = await getConnection()
   const result= await pool.request().query(querys.getTipoServicios)
   res.json(result.recordset)
  } catch (error) {
   res.status(500);
   res.send(error.message);
  }
};

//---------------------- porcentajes de los tipos de citas -----------------------

exports.getServiceCategoryAverages = async (req, res) => {
  try {
      // Conexión a la base de datos
      const pool = await getConnection();

      // Consulta SQL para contar las citas por servicio (ID_Servicio)
      const result = await pool.request().query(`
          SELECT 
              ID_Servicio,
              COUNT(*) AS total_citas
          FROM tbl_Citas
          GROUP BY ID_Servicio
      `);

      // Crear un objeto para mapear los ID de servicio con sus nombres y promedios
      const serviceCounts = result.recordset.reduce((acc, row) => {
          acc[row.ID_Servicio] = row.total_citas;
          return acc;
      }, {});

      // Total de citas registradas
      const totalCitas = Object.values(serviceCounts).reduce((sum, count) => sum + count, 0);

      // Crear el objeto con los promedios por servicio
      const averages = {
          "Certificado medico": ((serviceCounts[1] || 0) / totalCitas * 100).toFixed(1),
          "Toma de glucosa capilar": ((serviceCounts[2] || 0) / totalCitas * 100).toFixed(1),
          "Certificado prenupcial": ((serviceCounts[3] || 0) / totalCitas * 100).toFixed(1),
      };

      // Enviar la respuesta en formato JSON
      res.json({ averages });
  } catch (error) {
      // Manejo de errores
      res.status(500).send(error.message);
  }
};

