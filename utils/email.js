const nodemailer = require('nodemailer');

const sendEmail = (options) => {
  //1) CREATE A TRANSPORTER
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //2) DEFINE THE EMAIL OPTIONS
  const mailOptions = {
    from: 'Gabriel Cerka <Jonah@jonah.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };

  //3) ACTUALLY SEND THE EMAIL
  transporter.sendMail(mailOptions).then((result) => console.log(result));
};

module.exports = sendEmail;
