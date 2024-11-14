

const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/user.routes');
const morgan = require('morgan');
const config = require('./config');
const cookieParser = require('cookie-parser')
const requestIp = require('request-ip');

const app = express();

// Configuración del puerto
app.set('port', config.port);

// Middlewares
app.use(cookieParser())

// Configurar CORS
app.use(cors({
  origin: function (origin, callback) {
    return callback(null, true);
  },
  credentials: true
}));

// Agregar encabezados CORS a todas las respuestas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');


   // Agregar el encabezado Document-Policy para habilitar el Browser Profiling
   res.setHeader('Document-Policy', 'js-profiling');


   
  next();
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para obtener la IP del cliente
app.use(requestIp.mw());

// Rutas
app.use(userRoutes);

module.exports = app;

//prueba


///jsbdvbhjsdbvhabshbhjasda


