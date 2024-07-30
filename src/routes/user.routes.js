const { Router } = require('express');
////------------------USUARIOS PUBLICOS FUNCIONES------------------------------
const {
  getUser,
  createNewUser,
  getUserById,
  getComprobarCorreo,
  deleteUserById,
  getTotalUser,
  updateUserById,
  authenticateUser,
  updateCuentaEStado,
  EnviarCorreoRecuperacion,
  actualizarEstadoToken,
  compararTokenRecuperacion,
  enviarCorreoBloqueoCuenta,
  getComprobarPass,
  verifyToken,
  updateUserPasswordById,
  enviarTokenVerificacion,
  compararTokenVerificacion,
  activateCuentaId,
  enviarSMSRecuperacion,
  loginUser,
} = require("../controllers/user.controllers");


////------------------FUNCIONES  ADmin ------------------------------------------
const {getPersonal, 
  getTipoCargo,
  createNewPersonal,
  updateEstadoPersonalById,
  updatePersonalById,
  authenticatePersonal} =require("../controllers/personal.controllers");
const {getEmergencias, getTipoEmergencia,createNewEmergencia} =require("../controllers/emergencias.controllers");
const {getHistorialMedico,
  getHistorialMedicoById,
  createNewHistorialM,
  createNewAntecedentes,
  updateHistorialMedicoById,
  getAntecedentesById,
  getExpedienteById,
  updateAntecedentesById,
  createNewAntecedentes2,
  getAntecedentes,
  CreateNewExpedienteById,
  updateMedicamentoById,
  updateContactoEmergenciaById,
  updateInfoPerById} =require("../controllers/historialM.controllers");

  const getTiposServicio = require('../controllers/Servicio.controllers').getTiposServicio;


const {
  getCitas,
  updateCitasById,
  createNewCitas,
  getCitasHoy,
  getCitasHoyPorRango,
  getCitasLimitadas,
  getCitasPorFecha,
  getCitasPorFechaYRango,
  getCitaPorId,
  getCitasPorCorreo
} = require("../controllers/citas.controllers");


const router = Router();

//////-------------------RUTAS USUARIOS PUBLICOS---------------------------------------------------------
router.get("/user", getUser);

router.post("/user", createNewUser);

router.post("/user/authenticate", authenticateUser);

router.get("/user/count", getTotalUser);

router.get("/user/:id",getUserById);

router.post("/user/:correo",getComprobarCorreo);

router.post("/user/:contraseña",getComprobarPass);


router.delete("/user/:id",deleteUserById);

router.put("/user/:id",updateUserById );

router.put("/userCuenta/:id",updateCuentaEStado );

//  activar la cuenta
router.put("/ActivarCuenta/:id",activateCuentaId );

// Enviar correo de recuperación de contraseña
router.post("/recuperacionCorreo/:correo", EnviarCorreoRecuperacion);
// Enviar correo de recuperación de contraseña mediante SMS
router.post("/recuperacionSMS", enviarSMSRecuperacion);


// Actualizar el estado del token
router.put("/actualizarToken", actualizarEstadoToken);

router.put("/actualizarContraRecuperacion",updateUserPasswordById);

// Comparar el token de recuperación
router.post("/compararToken/:correo", compararTokenRecuperacion);

router.post("/notiCorreoCuentaBloqueada/:correo", enviarCorreoBloqueoCuenta);

router.post("/verifyToken", verifyToken);

// Enviar correo de Token de verificacion
router.post("/enviarverificacionCorreo/:correo", enviarTokenVerificacion);

// Comparar el token de verificacion
router.post("/verificacionTokenIdentificacion/:correo", compararTokenVerificacion);


router.post("/loginUser", loginUser)



//////-------------------RUTAS ADMIN---------------------------------------------------------

// Rutas de Personal
router.get("/personal",getPersonal);
router.get("/tipoCargo",getTipoCargo);
router.post("/registroPersonal",createNewPersonal);
router.put("/actualizarPersonal/:ID_Asociado",updatePersonalById)
router.put("/actualizarEstadoPersonal/:ID_Asociado",updateEstadoPersonalById);
router.post("/personal/authenticatePersonal", authenticatePersonal);

//Rutas de Emergencias
router.get("/Emergencias",getEmergencias);
router.get("/tipoEmergencia",getTipoEmergencia);
router.post("/registrarEmergencia",createNewEmergencia);

// Rutas de Historial Medico
router.get("/historialMedico",getHistorialMedico);
router.get("/Antecedente",getAntecedentes);
router.get("/historialMedicoId/:ID_Historial",getHistorialMedicoById);
router.get("/antecedentesID/:ID_Historial",getAntecedentesById);
router.get("/expedienteID/:ID_Historial",getExpedienteById);
router.post("/nuevoHistorialMedico",createNewHistorialM);
router.post("/antecedentesPatologico",createNewAntecedentes);
router.put("/historialMedico/:ID_Historial",updateHistorialMedicoById);
router.put("/actualizarAntecedentes/:ID_Historial",updateAntecedentesById)
router.post("/antecedentesPatologico2",createNewAntecedentes2);
router.post("/crearExpedienteID/:ID_Historial",CreateNewExpedienteById);
router.put("/actualizarMedicamentoID/:ID_Historial",updateMedicamentoById);
router.put("/actualizarContactoEmergenciaID/:ID_Historial",updateContactoEmergenciaById);
router.put("/actualizarInfoPerId/:ID_Historial",updateInfoPerById);


// Rutas de Citas
router.get("/citasRegistradas", getCitas);
router.put("/citas/:ID_Cita", updateCitasById);
router.post("/crearCita", createNewCitas);
router.get("/citasHoy", getCitasHoy);
router.get("/citasHoyRango", getCitasHoyPorRango);
router.get("/citasLimitadas", getCitasLimitadas);
router.get("/citasPorFecha", getCitasPorFecha);
router.get("/citasPorFechaYRango", getCitasPorFechaYRango);
router.get("/cita/:idCita", getCitaPorId);
router.get('/citas/correo', getCitasPorCorreo);



router.get('/tiposServicio', getTiposServicio);

module.exports =  router;
