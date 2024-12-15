module.exports = { querys : {
    getUser: "SELECT * FROM tbl_Usuarios",
    createNewUser: 'INSERT INTO tbl_Usuarios (nombre, apellidoP, apellidoM, correo, telefono, contrasena,  fecha_Registro, fecha_Sesion, estado_Usuario, estado_Cuenta, fecha_Bloqueo, token, fecha_Token, Id_Cargo) VALUES  (@nombre, @apellido_Paterno, @apellido_Materno, @correo, @telefono, @contraseña, GETDATE(), NULL, \'Activo\', \'Activa\', NULL, NULL, NULL,\'UNL\' )',


    getUserById: "SELECT * FROM tbl_Usuarios Where correo = @correo",


    comprobarPass: "SELECT * FROM tbl_Lista_Negra Where contraseña = @contraseña",

    deleteUser: "DELETE FROM tbl_Usuarios WHERE correo = @correo",
    getTotalUser: "SELECT COUNT(*) FROM tbl_Usuarios",
    
    updateUserById:
      "UPDATE tbl_Usuarios SET nombre = @nombre, apellido_Paterno = @apellido_Paterno, apellido_Materno = @apellido_Materno, correo = @correo, telefono = @telefono, contrasena = @contraseña WHERE correo = @correo",
    updateUserByIdContraseña:
    "UPDATE tbl_Usuarios SET contrasena = @contraseña WHERE correo = @correo" ,


    updateUserByIdEstadoCuenta:
    "UPDATE tbl_Usuarios SET estado_Cuenta = \'Bloqueada\',  fecha_Bloqueo = GETDATE() WHERE correo = @correo" ,


    getUserLogin:
    "SELECT correo, contrasena, estado_Cuenta , Id_Cargo, nombre, ID_Usuario FROM tbl_Usuarios  WHERE correo = @correo",

    getTelefono:
    "SELECT telefono, contrasena, estado_Cuenta , Id_Cargo, nombre, ID_Usuario FROM tbl_Usuarios  WHERE correo = @correo",


    getAccountsToActivate:
    "SELECT * FROM tbl_Usuarios WHERE estado_Cuenta = 'Bloqueada' AND fecha_Bloqueo <= DATEADD(DAY, -2, GETDATE());",


    getAccountsToActivateMinute:
    "SELECT * FROM tbl_Usuarios WHERE estado_Cuenta = 'Bloqueada' AND fecha_Bloqueo <= DATEADD(MINUTE, -3, GETDATE());",


    expirarToken:
    "SELECT * FROM tbl_Usuarios WHERE  fecha_Token <= DATEADD(MINUTE, -5, GETDATE());",

    updateAccountStatusToActive:
    "UPDATE tbl_Usuarios SET estado_Cuenta = 'Activa' WHERE correo = @correo",

    updateActivarCuentaId:
    "UPDATE tbl_Usuarios SET estado_Cuenta = 'Activa' WHERE correo = @correo",


    registrarTokenRecuperacion:
    "UPDATE tbl_Usuarios SET token = @token, fecha_token = GETDATE() WHERE correo = @correo;",


    registrarTokenVerificacion:
    "UPDATE tbl_Usuarios SET token = @token, fecha_token = GETDATE() WHERE correo = @correo;",


    obtenerTokenRecuperacion:
    "SELECT token FROM tbl_Usuarios WHERE correo = @correo;",

    obtenerTokenVerificacion:
    "SELECT token FROM tbl_Usuarios WHERE correo = @correo;",

    actualizarEstadoTokenRecuperacion:
    "UPDATE tbl_Usuarios SET token = 'expirado' WHERE correo = @correo; ",

    actualizarFechaInicioSesion:
    "UPDATE tbl_Usuarios  SET fecha_Sesion = GETDATE()  WHERE correo = @correo; ",

    logquery:
    "INSERT INTO Logs (AccionRealizada, IPAddress, UsernameEmail, DateTime, ActionDescription, RequestedURL, HttpStatusCode) VALUES (?, ?, ?, GETDATE(), ?, ?, ?);",




    
    //----------------------- Personal-------------------------
    getPersonal: "SELECT * FROM tbl_Personal",
    getTipoCargo:"SELECT * FROM tbl_Cargos",
    createNewPersonal: "INSERT INTO tbl_Personal (ID_Asociado,nombre,apellidoP,apellidoM,correo,contrasena,estado,delegacion,fecha_Registro,fecha_Sesion,estado_Usuario,estado_Cuenta,fecha_bloqueo,token,fecha_token,Id_Cargo) VALUES(@ID_Asociado,@nombre,@apellidoP,@apellidoM,@correo,@contrasena,@estado,@delegacion,GETDATE(), NULL, \'Activo\', \'Activa\',NULL,NULL,NULL,@Id_Cargo)",
    updatePersonalById:"UPDATE tbl_Personal SET Id_Cargo=@Id_Cargo WHERE ID_Asociado=@ID_Asociado",
    updateEstadoPersonalById:"UPDATE tbl_Personal SET estado_Usuario=@estado_Usuario WHERE ID_Asociado=@ID_Asociado;",
    getPersonalLogin:"SELECT nombre, contrasena, estado_Usuario, estado_Cuenta FROM tbl_Personal  WHERE ID_Asociado = @idIn",
    actualizarFechaInicioSesionPersonal:
    "UPDATE tbl_Personal  SET fecha_Sesion = GETDATE()  WHERE ID_Asociado = @idIn; ",


    //-----------------------Emergencias ----------------------
    getEmergencias:"SELECT * FROM tbl_Emergencias",
    getTipoEmergencia:"SELECT * FROM tbl_Tipos_Emergencia",
    createNewEmergencia: 'INSERT INTO tbl_Emergencias (folio,fecha,nombre,apellido_Paterno,apellido_Materno,lugar_Servicio,sexo,edad,ID_Emergencia,ID_Asociado) VALUES(@folio,GETDATE(),@nombre,@apellido_Paterno,@apellido_Materno,@lugar_Servicio,@sexo,@edad,@ID_Emergencia,@ID_Asociado)',

    //------------------Historial Medico ---------------------
    getHistorialMedico:"SELECT * FROM tbl_Historial_Medico",
    getAntecedentePa:"SELECT * FROM tbl_Antecedentes_Patologicos",
    getHistorialMedicoById:"SELECT * FROM tbl_Historial_Medico WHERE ID_Historial=@ID_Historial",
    getAntecedentesById:"SELECT * FROM tbl_Antecedentes_Patologicos WHERE ID_Historial=@ID_Historial",
    getExpedienteById:"SELECT * FROM tbl_Expediente WHERE ID_Historial=@ID_Historial",
    createNewHistorialM: "INSERT INTO tbl_Historial_Medico (fecha,nombre,apellido_Paterno,apellido_Materno,edad,Municipio,colonia,calle,telefono,nombre_Contacto,apellidoP_Contacto,apellidoM_Contacto,telefono_Contacto,alergico_Medicamento,ID_Asociado) VALUES  (GETDATE(),@nombre, @apellido_Paterno, @apellido_Materno,@edad,@Municipio,@colonia,@calle,@telefono,@nombre_Contacto,@apellidoP_Contacto,@apellidoM_Contacto,@telefono_Contacto,@alergico_Medicamento, 92229300)",
    createNewAntecedentes:"INSERT INTO tbl_Antecedentes_Patologicos(nombre,fecha_Diacnostico,tratamiento,ID_Historial) VALUES(@nombreAntecedente,@fecha_Diagnostico,@tratamiento,(select MAX(ID_Historial) from tbl_Historial_Medico))",
    updateHistorialMedicoById:"UPDATE tbl_Historial_Medico SET edad=@edad,Municipio=@Municipio,colonia=@colonia,calle=@calle,telefono=@telefono,nombre_Contacto=nombre_Contacto,apellidoP_Contacto=@apellidoP_Contacto,apellidoM_Contacto=@apellidoM_Contacto,telefono_Contacto=@telefono_Contacto,alergico_Medicamento=@alergico_Medicamento WHERE ID_Historial=@ID_Historial",
    updateAntecedentesById:"UPDATE tbl_Antecedentes_Patologicos SET nombreAntecedente=@nombreAntecedente,fecha_Diagnostico=@fecha_Diagnostico,tratamiento=@tratamiento WHERE ID_Antecedentes=@ID_Antecedentes",
    createNewAntecedentes2:"INSERT INTO tbl_Antecedentes_Patologicos(nombre,fecha_Diacnostico,tratamiento,ID_Historial) VALUES(@nombreAntecedente,@fecha_Diacnostico,@tratamiento,@idH)",
    updateMedicamentoById:"UPDATE tbl_Historial_Medico SET alergico_Medicamento=@alergico_Medicamento WHERE ID_Historial=@ID_Historial",
    updateContactoEmergenciaById:"UPDATE tbl_Historial_Medico SET nombre_Contacto=@nombre_Contacto,apellidoP_Contacto=@apellidoP_Contacto,apellidoM_Contacto=@apellidoM_Contacto,telefono_Contacto=@telefono_Contacto WHERE ID_Historial=@ID_Historial",
    updateDomicilioById:"UPDATE tbl_Historial_Medico SET Municipio=@Municipio,colonia=@colonia,calle=@calle, nombre=@nombre, apellido_Paterno=@apellido_Paterno, apellido_Materno=@apellido_Materno,edad=@edad, telefono=@telefono WHERE ID_Historial=@ID_Historial",


    //------------------- Citas -----------------------------
    getCitas:"SELECT * FROM tbl_Citas",
    updateCitasById:"UPDATE tbl_Citas SET estado=@estado WHERE ID_Cita=@ID_Cita",
    createNewCitas:"INSERT INTO tbl_Citas (nombre, apellido_Paterno, apellido_Materno, fecha, horario, estado, Id_Cargo, ID_Servicio, correo) VALUES (@nombre, @apellido_Paterno, @apellido_Materno, @fecha, CAST(@horario AS TIME), 'Pendiente', 'UNC', @ID_Servicio, @correo)",
    updateFechaCitaById:"UPDATE tbl_Citas SET fecha=@fecha, horario=@horario WHERE ID_Cita=@ID_Cita",
    updateCancelarCitaById:"UPDATE tbl_Citas SET estado=@estado WHERE ID_Cita=@ID_Cita",
    getTipoServicios:"SELECT * FROM tbl_Servicios",
    
    ////--------------Expedientes-------------------
    CreateNewExpedienteById:"INSERT INTO tbl_Expediente (fecha,motivo,diagnostico_ingreso,diagnostico_egreso,medicamentos,ID_Historial) VALUES(GETDATE(),@motivo,@diagnostico_ingreso,@diagnostico_egreso,@medicamentos,@ID_Historial)",
    

    getLoginUser:
    "SELECT correo, contrasena, estado_Cuenta , nombre, ID_Usuario FROM tbl_Usuarios  WHERE correo = @correo",

    //-----------------------Contratacion de Ambulancias ------------------------
    getContratacionAmbulancias: "SELECT * FROM tbl_Contratacion_Ambulancia",

    createContratacionSinRegistrar: "INSERT INTO tbl_Contratacion_Ambulancia (nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo, material_especifico, fecha, horario, ID_Tipo_Contratacion) VALUES(@nombre, @apellido_Paterno, @apellido_Materno, @inicio_Traslado, @escala, @destino_Traslado, @motivo, @material_especifico, @fecha, @horario, @ID_Tipo_Contratacion )",
    


    createContratacion: `
    INSERT INTO tbl_Contratacion_Ambulancia (nombre, apellido_Paterno, apellido_Materno, inicio_Traslado, escala, destino_Traslado, motivo, material_especifico, fecha, horario, ID_Usuario, ID_Tipo_Contratacion, estado, AmbulanciaID)
    VALUES (@nombre, @apellido_Paterno, @apellido_Materno, @inicio_Traslado, @escala, @destino_Traslado, @motivo, @material_especifico, @fecha, @horario, @ID_Usuario, @ID_Tipo_Contratacion, 'revision', @AmbulanciaID)
`,
    getAvailableAmbulances: "SELECT AmbulanciaID, NumeroAmbulancia, TipoAmbulancia, EstadoActual FROM Ambulancias WHERE EstadoActual = 'Disponible'",

    getTipoContratacion:"SELECT * FROM tbl_Tipo_Contratacion",

    getUserByEmail: `
    SELECT nombre, apellidoP, apellidoM 
    FROM tbl_Usuarios
    WHERE correo = @correo`,
    


  //----------------------------- Perfil ----------------------------
  getMiPerfilById: "SELECT nombre, apellidoP, apellidoM, correo, telefono FROM tbl_Usuarios Where ID_Usuario= @ID_Usuario",
  getContratacionById: "SELECT ID_Contratacion, destino_Traslado, motivo, fecha, horario, estado FROM tbl_Contratacion_Ambulancia Where ID_Usuario= @ID_Usuario",
  updateCancelarContratacionById:"UPDATE tbl_Contratacion_Ambulancia SET estado=@estado WHERE ID_Contratacion=@ID_Contratacion",
  
  getMiPerfilporCorreo: "SELECT ID_Usuario,nombre, apellidoP, apellidoM, correo, telefono FROM tbl_Usuarios Where correo= @correo",
 

  //------------------------------------------------- Suministros---------------------------

  registrarSuministro: "INSERT INTO tbl_Insumos_Medicos (clave, nombre_insumo, cantidad, lote, fecha_caducidad, ID_Asociado) VALUES(@clave, @nombre_insumo, @cantidad, @lote, @fecha_caducidad, '12345678')",
  getSuminitros: "SELECT * FROM tbl_Insumos_Medicos",

  //-----------------------------------Donaciones---------------------------------------
  getDonaciones: "SELECT * FROM tbl_Donaciones",

 },

};