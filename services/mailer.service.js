const ejs = require('ejs');
const fs = require('fs');
const config = require('../config');

const service = config.email.service;
const email = config.email.user;
const password = config.email.password;



// if you want to attach an image to the ejs file uncomment the attachment lines
const getAttachments = (templateName) => {
    switch (templateName) {
        case 'confirm-email':
            return [{
                filename: 'email.png',
                path: './public/images/email.png',
                cid: 'email_logo'
            },]
        case 'forgot-password-email':
            return [];
        default:
            return [];
    }
}



