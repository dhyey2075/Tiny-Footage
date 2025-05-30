// worker.js
import { Worker } from 'bullmq';
import connection from './redis/conn.js';
import { exec } from 'child_process';
import fs from 'fs';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

async function sendEmail(to, filename, protocol, host) {

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'dhyeypythonemail@gmail.com',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
      tls: {
        rejectUnauthorized: false // <- bypass cert errors (not for prod)
      }
    });

    const mailOptions = {
      from: 'dhyeypythonemail@gmail.com',
      to: to,
      subject: 'TinyFootage File Processing Completed',
      text: `Your file has been processed successfully and is ready for download. Check the following link to access your file ${protocol}://${host}/uploads/output/${filename}`,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent...', result);
  } catch (error) {
    console.log(error.message);
  }
}


const worker = new Worker(
  'uploadsQueue',
  async job => {
    console.log('Received job:', job.name);
    console.log('Data:', job.data);

    const { filename, originalname, email, protocol, host } = job.data;
    const inputPath = `uploads\\${filename}`;

    if(!fs.existsSync(inputPath)) {
        fs.mkdirSync('uploads', { recursive: true });
    }
    if(!fs.existsSync(`uploads\\output`)) {
        fs.mkdirSync('uploads\\output', { recursive: true });
    }

    exec(`ffmpeg -i ${inputPath} -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 96k uploads\\output\\${filename}`,
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Error processing video: ${error.message}`);
                throw error;
            }
            if (stderr) {
                console.error(`FFmpeg stderr: ${stderr}`);
              }
              console.log(`FFmpeg stdout: ${stdout}`);
              fs.unlinkSync(inputPath);
              sendEmail(email, filename, protocol, host).then(() => {
                console.log('Email sent successfully');
              }
              ).catch(err => {
                console.error('Error sending email:', err);
              });
            
    
            // Optionally, you can return some result or update the job status
            // return { message: 'Video processing completed', outputFile: `${inputPath}-o.mp4` };
        }
    )

  },
  { connection }
);

worker.on('completed', job => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed with ${err.message}`);
});
