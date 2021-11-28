const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const md5  = require('crypto-js/md5');

const PORT = 3000;
const WS_PORT = 3001;

const MATCHING = {};
const MATCHED = {};

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

app.use(express.json());

app.get('/id', (req, res) => {
  const uid = req.query.uid;
  const id = md5(uid).toString().slice(0, 6);

  console.log('Setting uid:', uid, id);

  res.json({ id: id });
});

server.listen(PORT, () => {
  console.log('Listening:', PORT);
});

wss.on('connection', function(socket) {
  console.log('Connected');

  socket.on('message', function(raw) {
    const message = JSON.parse(raw.toString());
    const { type, data } = message;

    switch(type) {
      case 'match': {
        console.log('Matching from:', data.from, 'to:', data.to);
        MATCHING[data.from] = socket;

        if (data.from !== data.to && MATCHING[data.to]) {
          MATCHED[data.to] = data.from;
          MATCHED[data.from] = data.to;

          [data.from, data.to].forEach(function(i) {
            MATCHING[i].send(JSON.stringify({
              type: 'matched'
            }));

            console.log('Matched:', i);
          });
        }

        return;
      };
      case 'send': {
        const to = MATCHED[data.from]

        if (to) {
          MATCHING[to].send(JSON.stringify({
            type: 'received',
            data: data
          }));

          console.log('Sent from:', data.from, 'to:', to, 'data:', data);
        }

        return;
      };
    }
  });

  socket.on('close', function() {
    const id = Object.keys(MATCHING).find(function(i) { return MATCHING[i] === socket; });

    if (id) {
      console.log('Closing:', id);

      delete(MATCHING[id]);
    }
  });
});
