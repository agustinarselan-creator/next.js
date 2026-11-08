const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3030);
const PUBLIC_DIR = path.join(__dirname, 'public');
const API_URL = 'https://api.openai.com/v1/images/generations';
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-flare';
const MAX_BODY = 24_000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error('La solicitud es demasiado larga.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('La solicitud no contiene JSON válido.'));
      }
    });
    req.on('error', reject);
  });
}

async function generate(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 503, {
      error: 'Falta configurar OPENAI_API_KEY en Windows antes de iniciar la app.',
    });
  }

  try {
    const input = await readJson(req);
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const size = ['1024x1024', '1536x1024', '1024x1536'].includes(input.size)
      ? input.size
      : '1024x1024';
    const quality = ['low', 'medium', 'high'].includes(input.quality)
      ? input.quality
      : 'medium';
    const background = input.transparent === true ? 'transparent' : 'opaque';
    if (!prompt) return sendJson(res, 400, { error: 'Escribe una descripción para la imagen.' });
    if (prompt.length > 8000) return sendJson(res, 400, { error: 'La descripción supera los 8.000 caracteres.' });

    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size,
        quality,
        output_format: 'png',
        background,
        n: 1,
      }),
    });

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const message = result?.error?.message || `La API respondió con estado ${upstream.status}.`;
      return sendJson(res, upstream.status, { error: message });
    }

    const image = result?.data?.[0]?.b64_json;
    if (!image) return sendJson(res, 502, { error: 'La API no devolvió una imagen. Inténtalo otra vez.' });
    return sendJson(res, 200, { image, format: 'png' });
  } catch (error) {
    if (!res.headersSent) sendJson(res, 400, { error: error.message || 'No se pudo procesar la solicitud.' });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === 'POST' && url.pathname === '/api/generate') {
    return generate(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD, POST' });
    return res.end('Method not allowed');
  }

  const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, requested);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('No se encontró la página.');
    }
    res.writeHead(200, {
      'content-type': types[path.extname(filePath)] || 'application/octet-stream',
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Generador listo en http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) console.log('Configura OPENAI_API_KEY en PowerShell antes de generar.');
});
