let fs = require('fs');
let https = require('https');

let ytdl = require('ytdl-core');
let YouTube = require('simple-youtube-api');
let yt = new YouTube(api.key);

let api = require('./api.json');
let url = 'youtube playlist url goes here';
// ex. https://www.youtube.com/playlist?list=PLhHcMbVmbwCdYgDcW5-Ai5lXAqPAWihPc

// requests a file via url and returns the file buffer
// (only used for fetching the playlist thumbnail which is unused functionality)
function url2Buffer(url) {
    return new Promise(function(resolve, reject) {
        https.get(url, function(response) {
            let data = [];
            response.on('data', function(chunk) { data.push(chunk) });
            response.on('end', function() { resolve(Buffer.concat(data)) });
            response.on('error', function(error) { reject(error) });
        })
    });
}

// syncronously handles a stream (by way of await)
// (just returns a buffer)
function syncStream(stream) {
    return new Promise(function(resolve, reject) {
        let data = [];
        stream.on('data', function(chunk) { data.push(chunk) });
        stream.on('end', function() { resolve(Buffer.concat(data)) });
        stream.on('error', function(error) { reject(error) });
    });
}

async function start() {
    let playlist = await yt.getPlaylist(url);
    fs.mkdirSync(`./download/${playlist.title}`);
    
    //let thumbBuff = await url2Buffer(playlist.thumbnails.maxres.url);

    let videos = await playlist.getVideos();
    let c = 0;
    for (let v in videos) {
        c++;
        let videoTitle = videos[v].title;
        if (videoTitle.startsWith(`${playlist.title} - `)) { videoTitle = videoTitle.replace(`${playlist.title} - `, '') }
        videoTitle = videoTitle.replace('/', '');

        let videoUrl = videos[v].url;

        /*let description = videos[v].description.split('\n');
        let artists = 'unknown';
        for (let d = 0; d < description.length; d++) {
            let isArtist = false;
            if (description[d].toLowerCase().startsWith('composers: ')) { isArtist = true; description[d] = description[d].slice(10) }
            else if (description[d].toLowerCase().startsWith('artists: ')) { isArtist = true; description[d] = description[d].slice(9) }

            if (isArtist) {
                artists = description[d]
            }
            
        }*/

        // I attempted to use a library to add metadata to the generated mp3 file buffers, but nothing ever ended up working
        // eventually, I plan to look at the raw id3 standard and implement my own method of appending the metadata

        let stream = ytdl(videoUrl, { quality: 'highest', format: 'mp3' });
        let buffer = await syncStream(stream);

        fs.writeFileSync(`./download/${playlist.title}/${c} - ${videoTitle}.mp3`, buffer);
        console.log(`./download/${playlist.title}/${c} - ${videoTitle}.mp3`);
    }
}

start();