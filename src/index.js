require('dotenv').config();

const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const mysql = require('mysql2/promise');
const config = require('../config-db');

const PORT = process.env.PORT;
const app = express();

app.set('trust proxy', true);
app.set('view engine', 'ejs');

app.use(useragent.express());
app.use(cors());

app.get('/', async (req, res) => {
  const ipAddresses = req.ip.replace(/^::ffff:/, '');
  const { platform, browser, os } = req.useragent;

  console.log(req.params);

  const connection = await mysql.createConnection(config);

  const [rows] = await connection.execute('SELECT * FROM mst_phishing WHERE id = ?', [2]);

  console.log(rows);

  const [result] = await connection.query(
    'UPDATE mst_phishing SET counter = counter + 1, last_click = ? WHERE id = ?',
    [new Date(), 2]
  );
  if (result.affectedRows == 1) {
    console.log('success');
    res.render('index', { params: { ip: ipAddresses, device: `${platform} (${os})`, browser } });
  }

  // res.send({ ip: ipAddresses, device: `${platform} (${os})`, browser });
});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
