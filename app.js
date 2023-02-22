require('dotenv').config();
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs'); 
const { convertVideo, sleep, downloadMedia } = require('./utils/helpers');
const { phoneNumberFormatter } = require('./utils/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');

const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

/**
 * BASED ON MANY QUESTIONS
 * Actually ready mentioned on the tutorials
 * 
 * Many people confused about the warning for file-upload
 * So, we just disabling the debug for simplicity.
 */
app.use(fileUpload({
  debug: false
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  authStrategy: new LocalAuth()
});

client.on('message', async msg => {
  //console.log(msg);
  //console.log(process.env.TARGETNMB);
  if (msg.type === 'audio' && msg.from === '120363024953035513@g.us' && msg.author === '556194327885@c.us') {
    msg.reply('Audio recebido, fazendo a Homilia');
    

    await downloadMedia(msg);
    await sleep()
    await convertVideo()
    
    
    const media = MessageMedia.fromFilePath('./downloaded-media/video.mp4');
    msg.reply(media);
  }


  if (msg.body == '!ping') {
    msg.reply('Amo você sz');
  } else if (msg.body == 'good morning') {
    msg.reply('bom dia pro meu amor');
  } else if (msg.body == '!groups') {
    client.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);

      if (groups.length == 0) {
        msg.reply('You have no group yet.');
      } else {
        let replyMsg = '*YOUR GROUPS*\n\n';
        groups.forEach((group, i) => {
          replyMsg += `ID: ${group.id._serialized}\nName: ${group.name}\n\n`;
        });
        replyMsg += '_You can use the group id to send a message to the group._'
        msg.reply(replyMsg);
      }
    });
  }

});

client.initialize();

// Socket IO
io.on('connection', function(socket) {
  socket.emit('message', 'Conectando...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code recebido, escaneie-o com o WhatsApp!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp está pronto!');
    socket.emit('message', 'Whatsapp está pronto!');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'Whatsapp está autenticado!');
    socket.emit('message', 'Whatsapp esta autenticado!');
    console.log('AUTENTICADO');
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Falha na autenticação, reiniciando...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp está desconectado!');
    client.destroy();
    client.initialize();
  });
});


server.listen(port, function() {
  console.log('App funcionando na porta *: ' + port);
});
