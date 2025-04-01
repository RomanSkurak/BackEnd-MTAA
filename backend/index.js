const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();
const db = require('./db');


const setsRoutes = require('./routes/sets');

app.use(cors());
app.use(express.json());

app.use('/sets', setsRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});