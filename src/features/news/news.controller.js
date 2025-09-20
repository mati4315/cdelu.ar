"use strict";

// Controlador fino: orquesta request/response y delega a service

const service = require('./news.service');
const { spawn } = require('child_process');
const path = require('path');

async function getNews(request, reply) {
  try {
    const result = await service.listNews(request.query || {});
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al obtener las noticias' });
  }
}

async function getNewsById(request, reply) {
  try {
    const news = await service.getNewsById(Number(request.params.id));
    if (!news) return reply.status(404).send({ error: 'Noticia no encontrada' });
    return reply.send(news);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al obtener la noticia' });
  }
}

async function createNews(request, reply) {
  try {
    const created = await service.createNews(request.body, request.user.id);
    return reply.status(201).send(created);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al crear la noticia' });
  }
}

async function updateNews(request, reply) {
  try {
    const updated = await service.updateNews(Number(request.params.id), request.body, request.user);
    if (!updated) return reply.status(404).send({ error: 'Noticia no encontrada' });
    return reply.send(updated);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al actualizar la noticia' });
  }
}

async function deleteNews(request, reply) {
  try {
    const ok = await service.deleteNews(Number(request.params.id));
    if (!ok) return reply.status(404).send({ error: 'Noticia no encontrada' });
    return reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al eliminar la noticia' });
  }
}

async function likeNews(request, reply) {
  try {
    const success = await service.addLike(Number(request.params.id), request.user.id);
    if (!success) return reply.status(400).send({ error: 'Ya has dado like a esta noticia' });
    return reply.status(201).send({ message: 'Like agregado correctamente' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al dar like a la noticia' });
  }
}

async function unlikeNews(request, reply) {
  try {
    const success = await service.removeLike(Number(request.params.id), request.user.id);
    if (!success) return reply.status(404).send({ error: 'No se encontró el like' });
    return reply.status(200).send({ message: 'Like eliminado correctamente' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al eliminar el like' });
  }
}

async function createComment(request, reply) {
  try {
    const insertId = await service.createComment(Number(request.params.id), request.user.id, request.body.content);
    return reply.status(201).send({ id: insertId, message: 'Comentario creado correctamente' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al crear el comentario' });
  }
}

async function listComments(request, reply) {
  try {
    const rows = await service.listComments(Number(request.params.id));
    return reply.send(rows);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al obtener los comentarios' });
  }
}

async function importNews(request, reply) {
  try {
    const index = Number.isInteger(request.body?.index) ? request.body.index : 0;

    const scriptPath = path.join(__dirname, '../../scripts/import-latest-news.js');

    const childEnv = { ...process.env, NOTICIA_NUMERO: String(index) };

    const child = spawn(process.execPath, [scriptPath], {
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('error', (err) => {
      request.log.error(err);
      return reply.status(500).send({ error: 'No se pudo iniciar el proceso de importación' });
    });

    child.on('close', (code) => {
      if (code === 0) {
        return reply.send({ message: 'Importación finalizada', output: stdout.trim() });
      } else {
        request.log.error({ code, stderr });
        return reply.status(500).send({ error: 'Error al importar la noticia', details: stderr.trim() });
      }
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al disparar la importación de noticias' });
  }
}

async function importNewsStream(request, reply) {
  try {
    const index = Number.isInteger(Number(request.query?.index)) ? Number(request.query.index) : 0;
    const scriptPath = path.join(__dirname, '../../scripts/import-latest-news.js');

    const childEnv = { ...process.env, NOTICIA_NUMERO: String(index) };

    reply.headers({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    reply.raw.flushHeaders?.();

    const child = spawn(process.execPath, [scriptPath], {
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const send = (type, data) => {
      reply.raw.write(`event: ${type}\n`);
      reply.raw.write(`data: ${data}\n\n`);
    };

    child.stdout.on('data', (chunk) => {
      send('log', chunk.toString().trim());
    });
    child.stderr.on('data', (chunk) => {
      send('error', chunk.toString().trim());
    });
    child.on('close', (code) => {
      if (code === 0) {
        send('done', 'ok');
      } else {
        send('done', `exit:${code}`);
      }
      reply.raw.end();
    });
    child.on('error', (err) => {
      send('error', `spawn_error: ${err.message}`);
      send('done', 'failed');
      reply.raw.end();
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Error al iniciar la importación en streaming' });
  }
}

module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  likeNews,
  unlikeNews,
  createComment,
  listComments,
  importNewsStream,
  importNews,
};


