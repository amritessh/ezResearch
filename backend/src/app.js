const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const healthRoutes = require('./api/routes/health.routes');
const userRoutes = require('./api/routes/user.routes');
const paperRoutes = require('./api/routes/paper.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
