require('dotenv').config();

const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const mysql = require('mysql2/promise');
const config = require('./config-db');
const path = require('path');
const moment = require('moment');
const https = require('https');
const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync(`./ssl/${process.env.SSL_FOLDER}.key`),
  cert: fs.readFileSync(`./ssl/${process.env.SSL_FOLDER}.crt`),
};

const PORT = process.env.PORT;
const app = express();

function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // Tanggapi dengan status 500 (Internal Server Error)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!',
  });
}

const dateNow = () => moment().utcOffset('+0700').format('YYYY-MM-DD HH:mm:ss');

// middleware for blocked ip
const blockedIPs = ['40.94.', '20.212.'];

const blockIPMiddleware = (clientIP) =>
  blockedIPs.some((blockedIP) => clientIP.startsWith(blockedIP));

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('port', PORT);

app.use(useragent.express());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(errorHandler);

app.get('/shared', async (req, res) => {
  const ipAddresses = req.ip.replace(/^::ffff:/, '');

  const { platform, browser, os } = req.useragent;

  const { id, subject } = req.query;

  if (subject !== process.env.DOMAIN) {
    return res.status(404).send('CANNOT PROCESS THIS REQUEST!!!');
  }

  const connection = await mysql.createConnection(config);

  const [resp] = await connection.query('SELECT COUNT(*) as count FROM mst_phishing WHERE id = ?', [
    id,
  ]);

  if (resp[0].count == 0) {
    return res.status(404).send('USER NOT FOUND');
  }

  if (!blockIPMiddleware(ipAddresses)) {
    const date = dateNow();

    await connection.beginTransaction();

    const [result] = await connection.query(
      'UPDATE mst_phishing SET counter = counter + 1, last_click = ?, last_accessed_ip = ?, last_accessed_device = ?, last_accessed_browser = ? WHERE id = ? AND subject = ?',
      [date, ipAddresses, `${platform} (${os})`, browser, id, subject]
    );
    if (result.affectedRows == 1) {
      await connection.commit();
    } else {
      connection.rollback();
      return res.status(400).send({ message: 'Cannot get user info' });
    }
  }
  const views = subject == 'PAJAK' ? 'pajak/index' : 'kemnaker/index';
  res.render(views, {
    params: { ip: ipAddresses, device: `${platform} (${os})`, browser, subject, id },
  });
});

// untuk menerima kiriman info access ketika ada interaksi dengan form
app.post('/postInfo', async (req, res) => {
  const { id, subject } = req.body;
  const connection = await mysql.createConnection(config);

  const last_input = dateNow();

  const [result] = await connection.execute(
    'UPDATE mst_phishing SET last_input = ? WHERE id = ? AND subject = ?',
    [last_input, id, subject]
  );

  if (result.affectedRows == 1) {
    res.status(200).send({ message: 'Save info access is success' });
  } else {
    res.status(400).send({ message: 'Save info access is failed' });
  }
});

app.post('/postdjpform', async (req, res) => {
  const {
    email,
    name,
    company,
    department,
    nik,
    upload_file_1,
    npwp,
    gender,
    upload_file_2,
    id_user,
    subject,
  } = req.body;
  const connection = await mysql.createConnection(config);

  const submit_date = dateNow();

  const [result] = await connection.execute(
    'INSERT INTO phishing_pajak_futaba (`email`, `name`, `submit_date`, `company`, `department`, `nik`, `upload_file_1`, `npwp`, `gender`, `upload_file_2`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [email, name, submit_date, company, department, nik, upload_file_1, npwp, gender, upload_file_2]
  );

  if (result.affectedRows == 1) {
    res.send({ message: 'Success' });
    const timeSubmit = dateNow();
    connection.execute(
      'UPDATE mst_phishing SET last_submit = ?, submit_counter = submit_counter + 1 WHERE id = ? AND subject = ?',
      [timeSubmit, id_user, subject]
    );
  } else {
    res.status(400).send({ message: 'Insert to database is failed' });
  }
});

app.post('/postkemnakerform', async (req, res) => {
  const {
    id_user,
    name,
    company,
    department,
    gender,
    opinion_ump,
    why_ump,
    how_much_ump,
    subject,
  } = req.body;

  const connection = await mysql.createConnection(config);

  const [rows] = await connection.execute('SELECT email FROM mst_phishing WHERE id = ?', [id_user]);

  if (rows.length == 0) {
    return res.status(400).send({ message: 'User not found' });
  }

  const user_email = rows[0].email;
  const submit_date = dateNow();

  const [result] = await connection.execute(
    'INSERT INTO phishing_kemnaker_futaba (email, submit_date, `name`, company, department, gender, opinion_ump, why_ump, how_much_ump) VALUES (?,?,?,?,?,?,?,?,?)',
    [user_email, submit_date, name, company, department, gender, opinion_ump, why_ump, how_much_ump]
  );

  if (result.affectedRows == 1) {
    res.send({ message: 'Success' });
    const timeSubmit = dateNow();
    connection.execute(
      'UPDATE mst_phishing SET last_submit = ?, submit_counter = submit_counter + 1 WHERE id = ? AND subject = ?',
      [timeSubmit, id_user, subject]
    );
  } else {
    res.status(400).send({ message: 'Insert to database is failed' });
  }
});

const server = https.createServer(sslOptions, app);

server.listen(PORT, () => console.log(`listening on port ${PORT}`));
