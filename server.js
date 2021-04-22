const fs = require("fs");
const https = require("https");
const archiver = require("archiver");
const { PassThrough } = require("stream");
const cliProgress = require("cli-progress");

// Define Paths
const url = "https://i.imgur.com/CFdbvLN.png";
const url2 = "https://i.imgur.com/scdbsUy.png";
const zipPath = `./zipped.zip`;

// Define Streams
const stream1 = new PassThrough();
const stream2 = new PassThrough();
const output = fs.createWriteStream(zipPath);

const multiBar = new cliProgress.MultiBar(
  {
    format: "{bar} {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    clearOnComplete: false,
    hideCursor: true,
  },
  cliProgress.Presets.shades_classic
);

const downloadFile = (url, stream) => {
  https.get(url, (res) => {
    let receivedBytes = 0;
    let totalBytes = res.headers["content-length"];
    let progressBar = multiBar.create(totalBytes, 0);
    res
      .on("data", (chunk) => {
        receivedBytes += chunk.length;
        progressBar.update(receivedBytes);
      })
      .pipe(stream);
  });
};

downloadFile(url, stream1);
downloadFile(url2, stream2);

// Archive Compression
const archive = archiver("zip", {
  gzip: true,
  zlib: { level: 9 },
});
archive.on("error", function (err) {
  throw err;
});

archive.append(stream1, { name: "img1.jpg" });
archive.append(stream2, { name: "img2.jpg" });
archive.finalize();
archive.pipe(output);

