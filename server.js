const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 4173;
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

function sendFile(filePath, response) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Archivo no encontrado.");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const safePath = path.normalize(decodeURIComponent(request.url.split("?")[0]));
  const requestedPath = safePath === "/" ? "/index.html" : safePath;
  const finalPath = path.join(publicDir, requestedPath);

  if (!finalPath.startsWith(publicDir)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Acceso denegado.");
    return;
  }

  fs.stat(finalPath, (error, stats) => {
    if (!error && stats.isDirectory()) {
      sendFile(path.join(finalPath, "index.html"), response);
      return;
    }

    sendFile(finalPath, response);
  });
});

server.listen(port, () => {
  console.log(`Saafar 1.0 H disponible en http://localhost:${port}`);
});
