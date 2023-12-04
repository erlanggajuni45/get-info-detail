const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const useragent = require('express-useragent');

dotenv.config();
const PORT = process.env.PORT;

const app = express();
app.set('trust proxy', true);
app.use(useragent.express());
app.use(cors());

app.get('/', (req, res) => {
  const ipAddresses = req.ip.replace(/^::ffff:/, '');
  const { platform, browser } = req.useragent;

  res.send({ ip: ipAddresses, device: platform, browser });
});

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
