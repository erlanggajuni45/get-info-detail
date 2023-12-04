const express = require('express');
const useragent = require('express-useragent');

const app = express();
app.set('trust proxy', true);
app.use(useragent.express());

app.get('/', (req, res) => {
  const ipAddresses = req.ip;
  console.log(ipAddresses);
  console.log(req.useragent);
  res.send(ipAddresses);
});

app.listen('5000', () => console.log('listening on port 5000'));
