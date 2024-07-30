require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);



const verifyToken2 = (token) => {
  try {
      // Verificar y decodificar el token
      const decoded = jwt.verify(token, 'APICRUZROJA'); // Utiliza la misma clave secreta que usaste para firmar el token
      return decoded;
  } catch (error) {
      // Si hay algún error al verificar el token (token inválido o expirado), devolvemos null
      return null;
  }
}

exports.getUser = async (req, res)=> {
   try {
    const pool = await getConnection()
    const result= await pool.request().query(querys.getUser)
    res.json(result.recordset)
   } catch (error) {
    res.status(500);
    res.send(error.message);
   }
};


exports.createNewUser = async (req, res) => {
  const { nombre, apellido_Paterno, apellido_Materno, correo, contraseña, telefono } = req.body;

  // Verificar si todos los campos están presentes
  if (nombre == null || apellido_Paterno == null || apellido_Materno == null || correo == null || telefono == null || contraseña == null ) {
    return res.status(400).json({ msg: "Por favor llene todos los campos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10); // Cifra la contraseña con bcrypt
    const pool = await getConnection();
    await pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
      .input("apellido_Materno", sql.VarChar, apellido_Materno)
      .input("correo", sql.VarChar, correo)
      .input("contraseña", sql.VarChar, hashedPassword) 
      .input("telefono", sql.VarChar, telefono)
      // Usa la contraseña cifrada
      .query(querys.createNewUser);

    // Enviar respuesta de éxito
    
    res.json({ nombre, apellido_Paterno, apellido_Materno, correo, contraseña, telefono });
  } catch (error) {
    // Enviar respuesta de error
    res.status(500).json({ error: error.message });
  }
};


///para registrar en la tabla log 
const insertLog = async (accionRealizada, ipAddress, usernameEmail, actionDescription, requestedURL, httpStatusCode, userId) => {

  try {
      const pool = await getConnection();
      const result = await pool.request()
          .input("accionRealizada", accionRealizada)
          .input("ipAddress", ipAddress)
          .input("usernameEmail", usernameEmail)
          .input("actionDescription", actionDescription)
          .input("requestedURL", requestedURL)
          .input("httpStatusCode", httpStatusCode)
          .input("userId", userId)
          .query("INSERT INTO Logs (AccionRealizada, IPAddress, UsernameEmail, fecha, ActionDescription, RequestedURL, HttpStatusCode, ID_Usuario) VALUES (@accionRealizada, @ipAddress, @usernameEmail, GETDATE(), @actionDescription, @requestedURL, @httpStatusCode, @userId)");
      console.log("Log registrado exitosamente");
  } catch (error) {
      console.error("Error al registrar el log:", error);
  }
};



exports.authenticateUser = async (req, res) => {
  const { correo, contraseña } = req.body;
  const clientIp = req.clientIp;
  console.log("IP del cliente:", clientIp);
  let userId;
  try {
    const pool = await getConnection();
    const result = await pool.request()
        .input("correo", correo)
        .query(querys.getUserLogin);

    if (result.recordset.length === 0) {
        // Si no se encuentra ningún usuario con el correo proporcionado
        return res.status(401).json({ mensaje: "Este correo no coincide con ningún correo registrado" });

    }

    const user = result.recordset[0];
    userId = user.ID_Usuario; // Asignar userId aquí
    console.log(userId);


    // Verificar si la cuenta está bloqueada
    if (user.estado_Cuenta === 'Bloqueada') {
      await insertLog( 'Inicio de Sesion Fallido',clientIp, correo,'Cuenta bloqueada','Login', '401',userId);
        return res.status(401).json({ mensaje: "Tu cuenta está bloqueada" });
       
    }

    const passwordMatch = await bcrypt.compare(contraseña, user.contrasena);
    if (passwordMatch) {
        // Si las contraseñas coinciden
        await pool.request()
            .input("correo", correo)
            .query(querys.actualizarFechaInicioSesion);
      await insertLog( 'Inicio de Sesion ',clientIp, correo,'El usuario paso la primera verificacion de identidad','Login', '200',userId);
        return res.json({ mensaje: "Autenticación exitosa" });
    } else {
        // Si las contraseñas no coinciden
        await insertLog( 'Inicio de Sesion Fallido',clientIp, correo,'Contrasena incorrecta','Login', '401',userId);
        return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        
    }
  } catch (error) {
    console.error("Error de autenticación:", error);
    await insertLog( 'Inicio de Sesion Fallido',clientIp, correo, clientIp,'Error Autentificacion','Login', '500',userId);
    return res.status(500).json({ mensaje: "Error de autenticación" });
  }
};







exports.getUserById = async (req, res)=>{
    try {
        const pool = await getConnection();
    
        const result = await pool.request()
          .input("correo", req.params.id)
          .query(querys.getUserById);
        return res.json(result.recordset[0]);
      } catch (error) {
        res.status(500);
        res.send(error.message);
      }
    };

    exports.getComprobarCorreo = async (req, res) => {
      try {
        const pool = await getConnection();
    
        const result = await pool.request()
          .input("correo", req.params.correo)
          .query(querys.getUserById);
    
        if (result.recordset.length > 0) {
          // Si la consulta devuelve algún resultado, significa que el correo ya está registrado
          return res.json({ mensaje: "Este correo ya está registrado" });
        } else {
          // Si no hay resultados, el correo no está registrado
          return res.json({ mensaje: "Este correo no está registrado" });
        }
      } catch (error) {
        res.status(500);
        res.send(error.message);
      }
    };



    exports.getComprobarPass = async (req, res) => {
      try {
        const pool = await getConnection();
    
        const result = await pool.request()
          .input("contraseña", req.params.contraseña)
          .query(querys.comprobarPass);
    
        if (result.recordset.length > 0) {
          // Si la consulta devuelve algún resultado, significa que el correo ya está registrado
          return res.json({ mensaje: "rechazado" });
        } else {
          // Si no hay resultados, el correo no está registrado
          return res.json({ mensaje: "aprovado" });
        }
      } catch (error) {
        res.status(500);
        res.send(error.message);
      }
    };


    exports.deleteUserById = async (req, res)=>{
      try {
          const pool = await getConnection();
      
          const result = await pool.request()
            .input("correo", req.params.id)
            .query(querys.deleteUser);
            if (result.rowsAffected[0] === 0) return   res.json({ mensaje: "No existe este Usuario" });

            res.json({ mensaje: " Usuario Eliminado Correctamente" })
        } catch (error) {
          res.status(500);
          res.send(error.message);
        }
      };
    

      exports.getTotalUser = async (req, res)=>{
        try {
            const pool = await getConnection();
        
            const result = await pool.request()
              .query(querys.getTotalUser);
              res.json(result.recordset[0][""]);
          } catch (error) {
            res.status(500);
            res.send(error.message);
          }
        };


        exports.updateUserById = async (req, res) => {
          const { nombre, apellido_Paterno, apellido_Materno, correo, telefono, contraseña, fecha_Nacimiento} = req.body;
        
          // validating
          if (nombre == null || apellido_Paterno == null || apellido_Materno == null|| correo == null|| telefono == null|| contraseña == null|| fecha_Nacimiento == null) {
            return res.status(400).json({ msg: "Por favor llene todo los campos" });
          }
        
          try {
            const pool = await getConnection();
            await pool
              .request()
              .input("nombre", sql.VarChar, nombre)
              .input("apellido_Paterno", sql.VarChar, apellido_Paterno)
              .input("apellido_Materno", sql.VarChar,apellido_Materno )
              .input("correo", sql.VarChar, correo )
              .input("telefono", sql.VarChar, telefono)
              .input("contraseña", sql.VarChar, contraseña)
              .query(querys.updateUserById);
            res.json({ nombre, apellido_Paterno, apellido_Materno, correo, telefono, contraseña });
          } catch (error) {
            res.status(500);
            res.send(error.message);
          }
        };
        
//BNLOQUEAR LA CUENTA
        exports.updateCuentaEStado = async (req, res) => {
          const { correo} = req.body;
          const clientIp = req.clientIp;
  console.log("IP del cliente:", clientIp);
  let userId;

          const pool = await getConnection();
          const result = await pool.request()
              .input("correo", correo)
              .query(querys.getUserLogin);
      
          const user = result.recordset[0];
          userId = user.ID_Usuario; // Asignar userId aquí
          console.log(userId);
          // validating
          if (correo == null) {
            return res.status(400).json({ msg: "Por favor llene todo los campos" });
          }
        
          try {
            const pool = await getConnection();
            await pool
              .request()
              .input("correo", sql.VarChar, correo )
              .query(querys.updateUserByIdEstadoCuenta);
              await insertLog( 'Bloqueo De cuenta',clientIp, correo,'Cuenta bloqueada','Login', '401',userId);
            res.json({correo});
          } catch (error) {
            res.status(500);
            res.send(error.message);
          }
        };


//DESBLOQUEAR LA CUENTA 
        exports.activateCuentaId = async (req, res) => {
          const { correo} = req.body;
          const clientIp = req.clientIp;
          console.log("IP del cliente:", clientIp);
          let userId;
        
                  const pool = await getConnection();
                  const result = await pool.request()
                      .input("correo", correo)
                      .query(querys.getUserLogin);
              
                  const user = result.recordset[0];
                  userId = user.ID_Usuario; // Asignar userId aquí
                  console.log(userId);
      
          if (correo == null) {
            return res.status(400).json({ msg: "Por favor llene todo los campos" });
          }
        
          try {
            const pool = await getConnection();
            await pool
              .request()
              .input("correo", sql.VarChar, correo )
              .query(querys.updateActivarCuentaId);
              await insertLog( 'Desbloqueo De cuenta',clientIp, correo,'La Cuenta ha sido desbloqueada','Login', '200',userId);
            res.json({correo});
          } catch (error) {
            res.status(500);
            res.send(error.message);
          }
        };
        

        exports.updateUserPasswordById = async (req, res) => {
          const { correo, nuevaContraseña } = req.body;
          const clientIp = req.clientIp;
          console.log("IP del cliente:", clientIp);
          let userId;
        
                  const pool = await getConnection();
                  const result = await pool.request()
                      .input("correo", correo)
                      .query(querys.getUserLogin);
              
                  const user = result.recordset[0];
                  userId = user.ID_Usuario; // Asignar userId aquí
                  console.log(userId);
          // Verifica si el correo y la nueva contraseña están presentes
          if (!correo || !nuevaContraseña) {
            return res.status(400).json({ mensaje: "Por favor proporcione el correo y la nueva contraseña" });
          }
          
          try {
            // Genera el hash de la nueva contraseña
            const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
            
            // Obtiene una conexión a la base de datos
            const pool = await getConnection();
            
            // Ejecuta la consulta para actualizar la contraseña del usuario
            await pool.request()
              .input("correo", sql.VarChar, correo)
              .input("contraseña", sql.VarChar, hashedPassword)
              .query(querys.updateUserByIdContraseña); // Suponiendo que tienes una consulta SQL para actualizar la contraseña por correo
          
            // Envía una respuesta de éxito
            await insertLog( 'Actualizacion de Contrasena',clientIp, correo,'La Contrasena ha sido actualizada','Recuperacion', '200',userId);
            res.json({ mensaje: "Contraseña actualizada correctamente" });
          } catch (error) {
            // En caso de error, envía una respuesta de error
            await insertLog( ' Error Actualizacion de Contrasena',clientIp, correo,'La Contrasena no ha podido actualizarse','Recuperacion', '500',userId);
            console.error('Error al actualizar la contraseña:', error);
            res.status(500).json({ mensaje: 'Error al actualizar la contraseña', error: error.message });
          }
        };
        






// Función para activar cuentas bloqueadas después de 2 días
exports.activateBlockedAccounts = async () => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(querys.getAccountsToActivateMinute); // Query para obtener cuentas bloqueadas hace más de 2 días
        const accountsToActivate = result.recordset;

        // Itera sobre las cuentas a activar
        for (const account of accountsToActivate) {
            // Actualiza el estado de la cuenta a "activa"
            await pool.request()
            .input("correo", sql.VarChar, account.correo) // Utiliza "correo" en lugar de "accountId"
            .query(querys.updateAccountStatusToActive); // Query para actualizar estado de cuenta a "activa"
        }

        console.log(`${accountsToActivate.length} cuentas se activaron correctamente.`);
    } catch (error) {
        console.error("Error al activar cuentas bloqueadas:", error);
    }
};





exports.expirarTokensGenerados = async () => {
  try {
      const pool = await getConnection();
      const result = await pool.request()
          .query(querys.expirarToken); 
      const tokens = result.recordset;

      // Itera sobre las cuentas a activar
      for (const account of tokens) {
          // Actualiza el estado de la cuenta a "activa"
          await pool.request()
          .input("correo", sql.VarChar, account.correo) // Utiliza "correo" en lugar de "accountId"
          .query(querys.actualizarEstadoTokenRecuperacion); // Query para actualizar estado de cuenta a "activa"
      }

      console.log(`${tokens.length} cuentas se expiraron el token.`);
  } catch (error) {
      console.error("Error al expirar tokens:", error);
  }
};
// Programa la tarea para ejecutarse periódicamente
// Aquí debes usar la herramienta de programación de tareas de tu servidor o un servicio de terceros

// Ejemplo de cómo programar la tarea en un cron job en Node.js usando la librería node-cron

// Programa la tarea para ejecutarse todos los días a la medianoche
//cron.schedule('0 0 * * *', async () => {
  //  console.log('Ejecutando tarea para activar cuentas bloqueadas...');
    //await activateBlockedAccounts();
//});


// Programa la tarea para ejecutarse dentro de 5 minutos





// Tarea para activar cuentas bloqueadas
//cron.schedule('*/2 * * * *', async () => {
  //cron.schedule('0 0 * * *', async () => {
 // console.log('Ejecutando tarea para activar cuentas bloqueadas...');
 // await activateBlockedAccounts();
//});

// Tarea para expirar tokens generados
//cron.schedule('*/2 * * * *', async () => {
//  console.log('Ejecutando tarea para expirar tokens generados...');
 // await expirarTokensGenerados();
//});




/////MANDAR EL CORREO

const generarNuevoToken = () => {
  const token = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  return token.toString();
};

// Función para enviar correo de recuperación y registrar el token en la base de datos
exports.EnviarCorreoRecuperacion = async (req, res) => {
  const { correo } = req.body;
  const clientIp = req.clientIp;
  console.log("IP del cliente:", clientIp);
  let userId;

          const pool = await getConnection();
          const result = await pool.request()
              .input("correo", correo)
              .query(querys.getUserLogin);
      
          const user = result.recordset[0];
          userId = user.ID_Usuario; // Asignar userId aquí
          console.log(userId);
  const origen = "cruzrojasuport@gmail.com";
  const receptor = correo;
  const contraseña = "onopzodxqxheqwnz";
  const token = generarNuevoToken();

  try {
    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Registrar el token en la base de datos junto con la fecha y la hora actual
    await pool.request()
      .input("correo", sql.VarChar, correo)
      .input("token", sql.VarChar, token)
      .query(querys.registrarTokenRecuperacion); // Suponiendo que tienes una consulta SQL para registrar el token

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: origen,
        pass: contraseña
      }
    });

    // Configurar opciones del correo
    const mailOptions = {
      from: origen,
      to: receptor,
      subject: 'Recuperación de contraseña',
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
            .cruz-roja {
              float: left;
              margin-right: 20px;
              width: 150px;
              height: auto;
            }
            .token {
              font-size: 20px;
              font-weight: bold;
              color: #ff0000;
            }
          </style>
        </head>
        <body>
          <div class="banner">
            <h2>Recuperación de contraseña - Cruz Roja</h2>
          </div>
          <div class="container">
            <p>Estimado usuario,</p>
            <p>Recibió este correo electrónico porque solicitó un restablecimiento de contraseña para su cuenta.</p>
            <p>Por favor, copie y pegue el siguiente token en su navegador para completar el proceso:</p>
            <p class="token">${token}</p>
            <p>Si no solicitó un restablecimiento de contraseña, puede ignorar este correo electrónico y su cuenta permanecerá segura.</p>
          </div>
          <div class="footer">
            <p>Atentamente,</p>
            <p>El equipo de soporte de Cruz Roja</p>
          </div>
        </body>
      </html>`
    };

    // Enviar correo electrónico
    await transporter.sendMail(mailOptions);
    await insertLog( 'Recuperacion Contrasena',clientIp, correo,'El usuario ha solicitado recuperar su contrasena','Recuperacion', '200',userId);
    res.json({ mensaje: 'Correo de recuperación enviado correctamente' });
  } catch (error) {
    // Manejo de errores
    console.error('Error al enviar el correo electrónico:', error);
    await insertLog( 'Recuperacion Contrasena',clientIp, correo,'La solicitud ha sido rechazada','Recuperacion', '500',userId);
    res.status(500).json({ mensaje: 'Error al enviar el correo electrónico', error: error.message });
  }
};




// Función para comparar el token proporcionado por el usuario con el almacenado en la base de datos
exports.compararTokenRecuperacion = async (req, res) => {
  const { correo, tokenUsuario } = req.body;
  try {
    // Verificar si el token proporcionado por el usuario está presente
    if (tokenUsuario === undefined) {
      return res.status(400).json({ mensaje: "El token proporcionado es inválido" });
    }

    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Obtener el token almacenado en la base de datos
    const result = await pool.request()
      .input("correo", sql.VarChar, correo)
      .query(querys.obtenerTokenRecuperacion);

    // Obtener el valor del token almacenado
    const tokenAlmacenado = result.recordset.length > 0 ? result.recordset[0].token : null;

    console.log("Token almacenado:", tokenAlmacenado);
    console.log("Token proporcionado:", tokenUsuario);

    // Verificar si el token almacenado está expirado
    if (tokenAlmacenado === 'expirado') {
      return res.json({ mensaje: "El token de recuperación ha expirado" });
    }

    // Comparar el token proporcionado por el usuario con el almacenado en la base de datos
    if (tokenUsuario === tokenAlmacenado) {
      res.json({ mensaje: "El token de recuperación es válido" });
    } else {
      res.json({ mensaje: "El token de recuperación es inválido" });
    }
  } catch (error) {
    console.error('Error al comparar el token de recuperación:', error);
    res.status(500).json({ mensaje: 'Error al comparar el token de recuperación' });
  }
};




// Función para actualizar automáticamente el estado del token después de 30 minutos
exports.actualizarEstadoToken = async (req, res) => {
  const { correo } = req.body;
  try {
    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Actualizar el estado del token asociado al correo proporcionado a "expirado" después de 30 minutos
    await pool.request()
      .input("correo", sql.VarChar, correo)
      .query(querys.actualizarEstadoTokenRecuperacion); // Suponiendo que tienes una consulta SQL para actualizar el estado del token

    res.json({ mensaje: `Estado del token asociado a ${correo} actualizado correctamente.` });
  } catch (error) {
    console.error('Error al actualizar el estado del token de recuperación:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el estado del token de recuperación' });
  }
};



exports.enviarCorreoBloqueoCuenta = async (req, res) => {
  const { correo } = req.body;
  const origen = "cruzrojasuport@gmail.com";
  const receptor = correo;
  const contraseña = "onopzodxqxheqwnz";

  try {
    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: origen,
        pass: contraseña
      }
    });

    // Configurar opciones del correo
    const mailOptions = {
      from: origen,
      to: receptor,
      subject: 'Cuenta bloqueada por seguridad',
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
            <h2>Cuenta bloqueada por seguridad - Cruz Roja</h2>
          </div>
          <div class="container">
            <p>Estimado usuario,</p>
            <p>Recientemente hemos detectado intentos de acceso no autorizados a su cuenta. Por razones de seguridad, hemos bloqueado temporalmente su cuenta.</p>
            <p>Su cuenta será desbloqueada automáticamente después de un día. Si este bloqueo no fue realizado por usted, le recomendamos que cambie su contraseña inmediatamente y revise la seguridad de su cuenta.</p>
            <p>Disculpe las molestias ocasionadas. Gracias por su comprensión y cooperación.</p>
          </div>
          <div class="footer">
            <p>Atentamente,</p>
            <p>El equipo de soporte de Cruz Roja</p>
          </div>
        </body>
      </html>`
    };

    // Enviar correo electrónico
    await transporter.sendMail(mailOptions);
    res.json({ mensaje: 'Correo de bloqueo de cuenta enviado correctamente' });
  } catch (error) {
    // Manejo de errores
    console.error('Error al enviar el correo de bloqueo de cuenta:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo de bloqueo de cuenta', error: error.message });
  }
};

exports.verifyToken = async (req, res) => {
  const {token} = req.body;

  if (!token) {
    return res.status(400).json({ mensaje: "Token no proporcionado" });
  }

  const decodedToken = verifyToken2(token);

  if (!decodedToken) {
    return res.status(401).json({ mensaje: "Token inválido" });
  }

  // El token es válido, puedes hacer lo que necesites aquí
  return res.status(200).json({ mensaje: "Token válido" });
};



exports.enviarTokenVerificacion = async (req, res) => {
  const { correo } = req.body;
  const origen = "cruzrojasuport@gmail.com";
  const receptor = correo;
  const contraseña = "onopzodxqxheqwnz";
  const token = generarNuevoToken(); // Esta función deberá generar un nuevo token de verificación

  try {
    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Registrar el token en la base de datos junto con la fecha y la hora actual
    await pool.request()
      .input("correo", sql.VarChar, correo)
      .input("token", sql.VarChar, token)
      .query(querys.registrarTokenVerificacion); // Suponiendo que tienes una consulta SQL para registrar el token de verificación

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: origen,
        pass: contraseña
      }
    });

    // Configurar opciones del correo
    const mailOptions = {
      from: origen,
      to: receptor,
      subject: 'Verificación de Identidad',
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
            .token {
              font-size: 20px;
              font-weight: bold;
              color: #ff0000;
            }
          </style>
        </head>
        <body>
          <div class="banner">
            <h2>Verificación de Identidad - Cruz Roja</h2>
          </div>
          <div class="container">
            <p>Estimado usuario,</p>
            <p>Le enviamos el token de verificación que debe utilizar para verificar su que sea usted el que esta iniciando sesion:</p>
            <p class="token">${token}</p>
            <p>Favor de no responder este correo electrónico.</p>
          </div>
          <div class="footer">
            <p>Atentamente,</p>
            <p>El equipo de soporte de Cruz Roja</p>
          </div>
        </body>
      </html>`
    };

    // Enviar correo electrónico
    await transporter.sendMail(mailOptions);
    res.json({ mensaje: 'Correo de verificación enviado correctamente' });
  } catch (error) {
    // Manejo de errores
    console.error('Error al enviar el correo de verificación:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo de verificación', error: error.message });
  }
};


exports.compararTokenVerificacion = async (req, res) => {
  const { correo, tokenUsuario } = req.body;
  const clientIp = req.clientIp;
  console.log("IP del cliente:", clientIp);
  let userId;

          const pool = await getConnection();
          const result = await pool.request()
              .input("correo", correo)
              .query(querys.getUserLogin);
      
          const user = result.recordset[0];
          userId = user.ID_Usuario; // Asignar userId aquí
          console.log(userId);
  try {
    // Verificar si el token proporcionado por el usuario está presente
    if (tokenUsuario === undefined) {
      return res.status(400).json({ mensaje: "El token proporcionado es inválido" });
    }

    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Obtener el token almacenado en la base de datos
    const result = await pool.request()
      .input("correo", sql.VarChar, correo)
      .query(querys.obtenerTokenVerificacion);

    // Obtener el valor del token almacenado
    const tokenAlmacenado = result.recordset.length > 0 ? result.recordset[0].token : null;

    console.log("Token almacenado:", tokenAlmacenado);
    console.log("Token proporcionado:", tokenUsuario);

    // Verificar si el token almacenado está expirado
    if (tokenAlmacenado === 'expirado') {
      await insertLog( 'Inisio de Sesion Fallido',clientIp, correo,'Inicio de sesion Fallido el token ha expirado','Doble Factor', '401',userId);
      return res.json({ mensaje: "El token de verificación ha expirado" });
    }

    // Comparar el token proporcionado por el usuario con el almacenado en la base de datos
    if (tokenUsuario === tokenAlmacenado) {

      const result2 = await pool.request()
      .input("correo", correo)
      .query(querys.getUserLogin);

  const user = result2.recordset[0];

      const paylod = {
          correo: user.correo,
          IsAuthenticated: true,
          rol: user.Id_Cargo,
          nombre: user.nombre
      };
      const clave = 'APICRUZROJA';
      const Token = jwt.sign(paylod, clave);

      // Configurar la cookie
      console.log("cookie enviada"+ Token)
      res.cookie("jwt", Token);
 
      await insertLog( 'Inisio de Sesion',clientIp, correo,'El usuario ha pasado el segundo metodo de autentificacion y se ha iniciado correctamente la sesion','Doble Factor', '200',userId);
      res.json({ mensaje: "El token de verificación es válido" });
    } else {
      res.json({ mensaje: "El token de verificación es inválido" });
    }
  } catch (error) {
    console.error('Error al comparar el token de verificación:', error);
    res.status(500).json({ mensaje: 'Error al comparar el token de verificación' });
  }
};




exports.enviarSMSRecuperacion = async (req, res) => {
  const { correo } = req.body;
  const clientIp = req.clientIp;
  let userId;

  try {
    // Obtener conexión a la base de datos
    const pool = await getConnection();

    // Obtener la información del usuario desde la base de datos
    const result = await pool.request()
      .input("correo", correo)
      .query(querys.getTelefono);

    if (result.recordset.length === 0) {
      // Si no se encuentra ningún usuario con el correo proporcionado
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Obtener el número de teléfono del usuario
    let telefono = result.recordset[0].telefono;
    userId = result.recordset[0].ID_Usuario;

    // Agregar la región al número de teléfono
    telefono = '+52' + telefono;

    // Generar un nuevo token
    const token = generarNuevoToken();

    // Registrar el token en la base de datos junto con la fecha y la hora actual
    await pool.request()
      .input("correo", sql.VarChar, correo)
      .input("token", sql.VarChar, token)
      .query(querys.registrarTokenRecuperacion);

    // Enviar el SMS utilizando Twilio
    client.messages.create({
      body: `Su Token de recuperación de contraseña es: ${token}`,
      from: '+19382019133', // Reemplazar con tu número de teléfono de Twilio
      to: telefono
    })
    .then(message => {
      console.log('SMS enviado correctamente:', message.sid);
      // Registrar la acción en el log
      insertLog('Recuperacion Contrasena', clientIp, correo, 'El usuario ha solicitado recuperar su contraseña Mediante SMS', 'Recuperacion', '200', userId);
      res.json({ mensaje: 'SMS de recuperación enviado correctamente' });
    })
    .catch(error => {
      console.error('Error al enviar el SMS de recuperación:', error);
      // Manejo de errores
      insertLog('Recuperacion Contrasena', clientIp, correo, 'La solicitud ha sido rechazada', 'Recuperacion', '500', userId);
      res.status(500).json({ mensaje: 'Error al enviar el SMS de recuperación', error: error.message });
    });
  } catch (error) {
    // Manejo de errores
    console.error('Error al enviar el SMS de recuperación:', error);
    insertLog('Recuperacion Contrasena', clientIp, correo, 'La solicitud ha sido rechazada', 'Recuperacion', '500', userId);
    res.status(500).json({ mensaje: 'Error al enviar el SMS de recuperación', error: error.message });
  }
};




exports.loginUser = async (req, res) => {
  const { correo, contrasena } = req.body;
  const clientIp = req.clientIp;
  console.log("IP del cliente:", clientIp);
  let userId;
  try {
    const pool = await getConnection();
    const result = await pool.request()
        .input("correo", correo)
        .query(querys.getLoginUser);

    if (result.recordset.length === 0) {
        // Si no se encuentra ningún usuario con el correo proporcionado
        return res.status(401).json({ mensaje: "Este correo no coincide con ningún correo registrado" });

    }

    const user = result.recordset[0];
    userId = user.ID_Usuario; // Asignar userId aquí
    console.log(userId);

    const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
    if (passwordMatch) {
        // Si las contraseñas coinciden
        await pool.request()
            .input("correo", correo)
            .query(querys.actualizarFechaInicioSesion);
      await insertLog( 'Inicio de Sesion ',clientIp, correo,'El usuario paso la primera verificacion de identidad','Login', '200',userId);
        return res.json({ mensaje: "Autenticación exitosa", nombre: user.nombre, ID_Usuario: userId, correo: user.correo });
    } else {
        // Si las contraseñas no coinciden
        await insertLog( 'Inicio de Sesion Fallido',clientIp, correo,'Contrasena incorrecta','Login', '401',userId);
        return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        
    }
  } catch (error) {
    console.error("Error de autenticación:", error);
    await insertLog( 'Inicio de Sesion Fallido',clientIp, correo, clientIp,'Error Autentificacion','Login', '500',userId);
    return res.status(500).json({ mensaje: "Error de autenticación" });
  }
};