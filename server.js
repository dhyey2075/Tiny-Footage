import express from 'express';
import cors from 'cors';
import { Queue } from 'bullmq';
import connection from './redis/conn.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  '/oauth2callback'
);

if(!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

const myQueue = new Queue('uploadsQueue', { connection });

const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + uuidv4() + path.extname(file.originalname));
    }
})

app.use(cors({
    origin: ['http://localhost:5173',]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads/output", express.static("./uploads/output"));

const upload = multer({ storage: storage });


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  console.log('✅ Refresh token:', tokens.refresh_token);
  res.send('Authorization successful! You can close this tab.');
  process.exit(0);
});

app.get('/addjob', async(req, res) => {

    await myQueue.add('myJobName', { foo: 'bar' });

    res.json({
        message: 'Job added successfully!'
    });
})

app.post('/upload', upload.single('file'), (req, res) => {

    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(req.file);

    // Add job to the queue
    myQueue.add(`fileupload-${req.file.filename}`, { filename: file.filename, originalname: file.originalname, email: req.body.email, protocol: req.protocol, host: req.get('host') });

    res.json({
        message: 'File uploaded successfully!',
        file: {
            filename: file.filename,
            originalname: file.originalname,
        },
        email: req.body.email
    });
})

app.listen(5000, () => {
    console.log('Server is running...');
}) 