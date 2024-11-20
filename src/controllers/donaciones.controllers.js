require('dotenv').config();
const { getConnection, sql, querys } = require("../database/connection");
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.getDonaciones = async (req, res)=> {
    try {
     const pool = await getConnection()
     const result= await pool.request().query(querys.getDonaciones)
     res.json(result.recordset)
    } catch (error) {
     res.status(500);
     res.send(error.message);
    }
};