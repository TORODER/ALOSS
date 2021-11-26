import emailer from "nodemailer";
import * as emailConfig from "@src/config/email.config";

export function initEmailer() {
    const transporter = emailer.createTransport({
        host: emailConfig.mailServiceHost,
        port: emailConfig.mailServicePort,
        secure: emailConfig.mailServicePortSecure,
        auth: {
            user: emailConfig.mail,
            pass: emailConfig.mailPasswd, 
        },
    });
    return transporter;
}
