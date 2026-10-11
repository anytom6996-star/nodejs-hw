require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectMongoDB = require('./db/connectMongoDB');
const logger = require('./middleware/logger');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const notesRoutes = require('./routes/notesRoutes');

const app = express();

app.use(logger);
app.use(cors());
app.use(express.json());

app.use(notesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await connectMongoDB();

  app.listen(process.env.PORT || 10000, () => {
    console.log(`Server is running on port ${process.env.PORT || 10000}`);
  });
};

startServer();