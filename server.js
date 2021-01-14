const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const app = require('./app');

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((connection) => {
    console.log('DATABASE CONNECTED !...');
  })
  .catch((error) => console.log(error));

const server = app.listen(process.env.PORT, () => {
  console.log('Ambiente atual : ', process.env.NODE_ENV);
  console.log(`App listening on port ${process.env.PORT}`);
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION ! SHUTTING DOWN');
  console.log('====================================');
  console.log(err.name, err.message);
  console.log('====================================');
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION ! SHUTTING DOWN ! ...');
  console.log('====================================');
  console.log(err);
  console.log('====================================');
  server.close(() => {
    process.exit(1);
  });
});
