process.env.NODE_ENV = "production";

const express = require('express');
const bodyParser = require('body-parser');
const mailjet = require('node-mailjet');
const md5 = require('md5');

function requireEnvironmentVariable(name)
{
    if (process.env[name])
        return process.env[name];
    throw new Error(`Environment variable ${name} must be set to run this application.`);
}

const config = {
    mailjetPublicKey: requireEnvironmentVariable("MJ_APIKEY_PUBLIC"),
    mailjetPrivateKey: requireEnvironmentVariable("MJ_APIKEY_PRIVATE"),
    port: process.env.PORT || 3000
};

const mailjetClient = mailjet
    .connect(config.mailjetPublicKey, config.mailjetPrivateKey);

function sendEmailToHubolAsync(message)
{
    return mailjetClient
        .post("send", {'version': 'v3.1'})
        .request({
            "Messages":[
                {
                    "From": {
                        "Email": "superbogusmail@gmail.com",
                        "Name": "Superb Ogus"
                    },
                    "To": [
                        {
                            "Email": "hubol.gordon@gmail.com",
                            "Name": "Hubol"
                        }
                    ],
                    "Subject": `Some shit happened (${md5(message)})`,
                    "HtmlPart": `<code>${message}</code>`
                }
            ]
        });
}

function handleSendMessage(request, response)
{
    console.log(`Got request body: ${JSON.stringify(request.body)}`);

    if (!request.body || typeof request.body !== "string")
    {
        response.status(400).send();
        return;
    }

    response.status(202).send();
    setTimeout(async () =>
    {
        console.log("Sending email...");
        try
        {
            const response = await sendEmailToHubolAsync(request.body);
            console.log(`...done. Got response: ${JSON.stringify(response)}`);
        }
        catch (e)
        {
            console.error(`...Failed: ${e}`);
        }
    });
}

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.text({ type: () => true }));

app.post('/', handleSendMessage);

app.listen(config.port, () => console.log(`Listening on port ${config.port}, using environment ${process.env.NODE_ENV}`));