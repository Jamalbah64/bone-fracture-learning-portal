//Router for the login and registration endpoints

const express = require('express');
const Router = express.Router();
const {register, login} = require('./authController');

//User registration route

Router.post('/register', register);

//User login route
Router.post('/login', login);

module.exports = Router;
