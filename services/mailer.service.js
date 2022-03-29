const config = require("../config");
const mailjet = require("node-mailjet").connect(
  config.mailJet.apiKey,
  config.mailJet.secretKey
);

const service = config.email.service;
const email = config.email.user;
const password = config.email.password;

// if you want to attach an image to the ejs file uncomment the attachment lines
// const getAttachments = (templateName) => {
//     switch (templateName) {
//         case 'confirm-email':
//             return [{
//                 filename: 'email.png',
//                 path: './public/images/email.png',
//                 cid: 'email_logo'
//             },]
//         case 'forgot-password-email':
//             return [];
//         default:
//             return [];
//     }
// }

const sendMail = async (email, resetLink, username) => {
  const request = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "jokanola.it@gmail.com",
          Name: "Yusuff",
        },
        To: [
          {
            Email: email,
            Name: username,
          },
        ],
        Subject: "Password Reset",
        HTMLPart: `<h3>Dear ${username},
        </h3>
        <p>You requested for a password reset, kindly use this <a href=${resetLink}>link</a> to reset your
            password</p>
        <br>
        <p>Cheers!</p>`,
      },
    ],
  });
  return request;
};

module.exports = { sendMail };
