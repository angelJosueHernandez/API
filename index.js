
/*
const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/user.routes');
const morgan = require('morgan');
const config = require('./config');

const app = express();

// Configuración del puerto
app.set('port', config.port);


  

app.use(morgan('dev'));
app.use(express.json());
// Middlewares
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
  }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
app.use(express.urlencoded({ extended: false }));
app.use('/api', userRoutes);
app.get("/", (req,res)=>{
    res.send('welcomen to my API');
});
app.listen(app.get("port"));

console.log("Server on port", app.get("port"));

*/
const app = require('./app');

app.get("/", (req, res)=>{
    const htlmRespose=`
    <htlm>
    <head><title>Home Page</title></head
    <body>
    <h1>Hello World!</h
    </body>
    </htlm>
    `;
    res.send(htlmRespose)
    
});
app.listen(app.get("port"));

console.log("Server on port", app.get("port"));




