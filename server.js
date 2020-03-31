const express = require('express');
const featurePolicy = require('feature-policy');
const path = require('path');
const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;

//init app
const app = express();
const server = require('http').createServer(app);

const wss = new WebSocket.Server({ server });
const users = {};

const sendTo = (ws, message) => {
  ws.send(JSON.stringify(message))
}

wss.on('connection', ws => {
  console.log('User connected')

  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    let data = null

    try {
      data = JSON.parse(message)
    } catch (error) {
      console.error('Invalid JSON', error)
      data = {}
    }

    switch (data.type) {
      case 'login':
        console.log('User logged', data.username)
        if (users[data.username]) {
          sendTo(ws, {type: 'login', success: false })
        } else {
          users[data.username] = ws;
          ws.username = data.username;
          sendTo(ws, {type: 'login', success: true})
        }
        break
        case 'offer':
        console.log('Sending offer to: ', data.otherUsername)
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername
          sendTo(users[data.otherUsername], {
            type: 'offer',
            offer: data.offer,
            username: ws.username
          })
        }
        break
        case 'answer':
        console.log('Sending answer to: ', data.otherUsername)
        if (users[data.otherUsername] != null) {
          ws.otherUsername = data.otherUsername
          sendTo(users[data.otherUsername], {
            type: 'answer',
            answer: data.answer
          })
        }
        break
        case 'candidate':
        console.log('Sending candidate to:', data.otherUsername)

        if (users[data.otherUsername] != null) {
          sendTo(users[data.otherUsername], {
            type: 'candidate',
            candidate: data.candidate
          })
        }
        break
    }
  });

  ws.on('close', () => {
    //handle closing
  })
});

app.use(featurePolicy({
  features: {
    camera: ["'*'"],
    microphone: ["'*'"]
  }
}));

//public
app.use(express.static(path.join(__dirname + '/public')));

server.listen(PORT, () => console.log(`listening on ${PORT}`));