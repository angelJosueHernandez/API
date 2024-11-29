require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const moment = require('moment');


exports.getFeedbackRating = async (req, res) => {
    try {
      // Conexión a la base de datos
      const pool = await getConnection();
      
      // Consulta SQL para sumar los valores de 'rating' y contar el total de registros
      const result = await pool.request().query(`
        SELECT 
          SUM(rating) AS totalRating,
          COUNT(*) AS totalRecords
        FROM tbl_Feedback
      `);
      
      // Extraer los datos del resultado
      const { totalRating, totalRecords } = result.recordset[0];
      
      // Calcular el promedio
      const averageRating = totalRecords > 0 ? (totalRating / totalRecords).toFixed(1) : 0;
      
      // Enviar la respuesta en formato JSON
      res.json({ averageRating });
    } catch (error) {
      // Manejo de errores
      res.status(500);
      res.send(error.message);
    }
};

exports.getFeedbackCategoryPercentages = async (req, res) => {
  try {
      // Conexión a la base de datos
      const pool = await getConnection();

      // Consulta SQL para contar las ocurrencias de cada rating
      const result = await pool.request().query(`
          SELECT 
              rating,
              COUNT(*) AS count
          FROM tbl_Feedback
          GROUP BY rating
      `);

      // Total de registros y conteo por categoría
      const feedbackCounts = result.recordset.reduce((acc, row) => {
          acc[row.rating] = row.count;
          return acc;
      }, {});

      const totalFeedbacks = Object.values(feedbackCounts).reduce((sum, count) => sum + count, 0);

      // Calcular porcentajes
      const percentages = {
          "Muy malo": ((feedbackCounts[1] || 0) / totalFeedbacks * 100).toFixed(1),
          "Malo": ((feedbackCounts[2] || 0) / totalFeedbacks * 100).toFixed(1),
          "Regular": ((feedbackCounts[3] || 0) / totalFeedbacks * 100).toFixed(1),
          "Bueno": ((feedbackCounts[4] || 0) / totalFeedbacks * 100).toFixed(1),
          "Muy bueno": ((feedbackCounts[5] || 0) / totalFeedbacks * 100).toFixed(1),
      };

      // Enviar la respuesta en formato JSON
      res.json({ percentages });
  } catch (error) {
      // Manejo de errores
      res.status(500).send(error.message);
  }
};
