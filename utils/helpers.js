const videoshow = require('videoshow');
const fs = require('fs');

const convertVideo = async () => {
  console.log(' > Renderizando Video!')
    const images = [
      {
        path: '/home/guis/Projects/whatsapp-api-tutorial/downloaded-media/image.png',
      },
    ];

    const videoOptions = {
      fps: 25,
      loop: await audioDuration(), // seconds
      transition: false,
      videoBitrate: 250, //await calculateBitrate(),
      videoCodec: 'libx264',
      size: '640x?',
      audioBitrate: '128k',
      audioChannels: 2,
      format: 'mp4',
      pixelFormat: 'yuv420p',
    };
    console.log(`videoBitrate atual: ${videoOptions.videoBitrate}`)
    await new Promise((resolve) => {
      videoshow(images, videoOptions)
        .audio('/home/guis/Projects/whatsapp-api-tutorial/downloaded-media/audio.mp3')
        .save('/home/guis/Projects/whatsapp-api-tutorial/downloaded-media/video.mp4')
        .on('start', () => {
          console.log(' > Renderizando Video!');
        })

        .on('start', (command) => {
          console.log('ffmpeg process started:', command);
        })
        .on('progress', (data) => {
          console.log(`Progress:${data.percent.toFixed(0)}%`);
          console.log(`Frames: ${data.frames}`);
        })

        .on('error', (err, stdout, stderr) => {
          console.log('Error:', err);
          console.log('ffmpeg stderr:', stderr);
        })
        .on('end', async (output) => {
          console.log('Video created in:', output);

          const stats = fs.statSync('/home/guis/Projects/whatsapp-api-tutorial/downloaded-media/video.mp4');
          console.log(stats.size)
          resolve()

        });
    });
  
};

const audioDuration = async () => {
  // eslint-disable-next-line global-require
  const ffmpeg = require('fluent-ffmpeg');
  const audioFile = '/home/guis/Projects/whatsapp-api-tutorial/downloaded-media/audio.mp3';
  console.log(audioFile)
  return new Promise((resolve) => {
    ffmpeg.ffprobe(audioFile, (err, metadata) => {
      const secondsAudio = parseInt(metadata.format.duration, 10);
      console.log(' > Audio Duração Salvo!');
      console.log(` > Audio Duração: ${secondsAudio}`);
      resolve(secondsAudio);
    });
  });
};

const sleep = async (milliseconds = 5000) => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
  console.log(' > Sleep!');
};

const downloadMedia = async (msg) => {
  // NOTE!
  // UNCOMMENT THE SCRIPT BELOW IF YOU WANT TO SAVE THE MESSAGE MEDIA FILES
  // Downloading media
    msg.downloadMedia().then(media => {
  //     // To better understanding
  //     // Please look at the console what data we get
      //console.log(media);

       if (media) {
  //       // The folder to store: change as you want!
  //       // Create if not exists
         const mediaPath = './downloaded-media/';

         if (!fs.existsSync(mediaPath)) {
           fs.mkdirSync(mediaPath);
         }

  //       // Get the file extension by mime-type
         //const extension = mime.extension(media.mimetype);
        
  //       // Filename: change as you want! 
  //       // I will use the time for this example
  //       // Why not use media.filename? Because the value is not certain exists
         const filename = 'audio';

         const fullFilename = mediaPath + filename + '.' + 'mp3';

  //       // Save to file
         try {
           fs.writeFileSync(fullFilename, media.data, { encoding: 'base64' }); 
           console.log('File downloaded successfully!', fullFilename);
         } catch (err) {
           console.log('Failed to save the file:', err);
         }
       }
     });
}


module.exports = {
  sleep,
  convertVideo,
  downloadMedia,
}
