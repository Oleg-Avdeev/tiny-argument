import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import connect from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express();

const server = http.createServer(app);
const io = new Server(server);
const db = connect();

app.use('/scripts', express.static(__dirname + "/public/scripts"));
app.use('/styles', express.static(__dirname + "/public/styles"));
app.use('/img', express.static(__dirname + "/public/img"));

app.get('/table/*', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {

	let urlblocks = socket.handshake.headers.referer.split('/');
	if (urlblocks[urlblocks.length - 2] != 'table')
		return;

	let table = urlblocks[urlblocks.length - 1];
	socket.join(table);

	console.log(`a user connected to ${table}`);

	if (!db.data[table]) {
		db.data[table] = {};
		db.data[table].meta = {
			'player-1': 'Мастер',
			'player-2': 'Игрок',
		}
		db.write();
	}

	socket.emit('state', getState());

	socket.on('disconnect', () => {
		console.log('user disconnected');
	});

	socket.on('toggle', (player, slot) => {

		if (!db.data[table][player])
			db.data[table][player] = {};

		let current = db.data[table][player][slot];
		let next = '';
		
		if (!current) next = 'white';
		else if (current == 'white') next = 'black';
		else if (current == 'black') next = '';
		db.data[table][player][slot] = next;

		db.write();

		io.to(table).emit('state', getState());
	});

	socket.on('setName', (player, name) => {
		if (!db.data[table].meta)
			db.data[table].meta = {}

		console.log(name);
		db.data[table].meta[player] = name;
		io.to(table).emit('state', getState());
		
		db.write();
	});

	function getState() {
		let meta = db.data[table].meta;
		let state = { meta: meta, table: [] }

		let playerKeys = Object.keys(db.data[table]);
		playerKeys
			.filter(p => p != 'meta')
			.flatMap(p => Object.keys(db.data[table][p]).map(s =>
			state.table.push({
				'player': p,
				'slot': s,
				'color': db.data[table][p][s]
			})
		))

		return state;
	}
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
	console.log('listening on *:3000');
});

