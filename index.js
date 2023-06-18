import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express();


app.use('/scripts', express.static(__dirname + "/public/scripts"));
app.use('/styles', express.static(__dirname + "/public/styles"));
app.use('/img', express.static(__dirname + "/public/img"));

app.get('/table/*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

export default app;
