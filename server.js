const fs = require("fs");
const https = require("https");
const archiver = require("archiver");
const { PassThrough } = require("stream");
const cliProgress = require("cli-progress");

// Define Paths
const url = "https://i.ytimg.com/vi/8NFsCDebQi0/maxresdefault.jpg";
const url2 =
  "https://filmdaily.co/wp-content/uploads/2020/09/DirtyFunnyMemes-lede72-1300x1115.jpg";
const zipPath = `${__dirname}/files/zipped.zip`;

// Define Streams
const stream1 = new PassThrough();
const stream2 = new PassThrough();
const output = fs.createWriteStream(zipPath);

let multiBar = new cliProgress.MultiBar(
  {
    format: "{bar} {percentage}% | ETA: {eta}s",
    clearOnComplete: false,
    hideCursor: true,
  },
  cliProgress.Presets.shades_classic
);

let outputSize = fs.statSync(zipPath);

const report = new PassThrough();
let receivedBytes = 0;
let progressBar = multiBar.create(outputSize, 0);
report.on("data", (chunk) => {
  receivedBytes += chunk.length;
  progressBar.update(receivedBytes);
});

const downloadFile = (url, stream, progress) => {
  https.get(url, (res) => {
    let receivedBytes = 0;
    let totalBytes = res.headers["content-length"];
    let progressBar = progress.create(totalBytes, 0);
    // progressBar.start(totalBytes, 0);
    res
      .on("data", (chunk) => {
        receivedBytes += chunk.length;
        progressBar.update(receivedBytes);
      })
      .pipe(stream);
  });
};

downloadFile(url, stream1, multiBar);
downloadFile(url2, stream2, multiBar);

// Archive Compression
const archive = archiver("zip", {
  gzip: true,
  zlib: { level: 9 },
});
archive.on("error", function (err) {
  throw err;
});

archive.append(stream1, { name: "zipimg.jpg" });
archive.append(stream2, { name: "img2.jpg" });
archive.pipe(report);
archive.pipe(output);

// multiBar.stop();
archive.finalize();
