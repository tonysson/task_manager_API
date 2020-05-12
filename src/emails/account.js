// const sgMail = require('@sendgrid/mail');

// const sendGridApiKey = "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";

// sgMail.setApiKey(sendGridApiKey);

// const sendWelcomeMail = (email, name) => {
//     sgMail.send({
//         to: email,
//         from: 'tonysson7@gmail.com',
//         subject: 'Thanks for join us!!',
//         text: ` welcome to the app ${name}.Let me know how to help`
//     });
// }


const api_key = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_API_DOMAIN;
const mailgun = require('mailgun-js')({ apiKey: api_key, domain });

const sendWelcomeMail = (email, name) => {
    mailgun.messages().send({
        from: 'Teyi  <sibi04122017@gmail.com>',
        to: email,
        subject: 'subscribe success',
        text: `Welcome to the app ${name}. Let me know how to help`
    });
};

const sendDeleteMail = (email, name) => {
    mailgun.messages().send({
        from: 'Teyi  <sibi04122017@gmail.com>',
        to: email,
        subject: 'Deleting account',
        text: `We noticed that you delete your account ${name}. Let us know what went wrong. hope to you'll be back soon.`
    });
};

module.exports = {
    sendWelcomeMail,
    sendDeleteMail
}




    