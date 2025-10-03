#!/usr/bin/env node
const amqp = require('amqplib/callback_api');

const url = process.env.RABBITMQ_URL || 'amqp://localhost';
const queue = 'tareas_distribuidas';
const workerName = process.env.WORKER_NAME || process.env.HOSTNAME || 'worker';

function start() {
  amqp.connect(url, (err, conn) => {
    if (err) {
      console.error(`[${workerName}] connect error: ${err.message || err}. retrying in 5s`);
      return setTimeout(start, 5000);
    }
    conn.createChannel((err, ch) => {
      if (err) throw err;

      ch.assertQueue(queue, { durable: true });
      ch.prefetch(1); // clave: no recibir otra tarea hasta ack

      console.log(`[${workerName}] Waiting for tasks in ${queue}...`);

      ch.consume(queue, (msg) => {
        if (!msg) return;
        const task = JSON.parse(msg.content.toString());
        console.log(`[${workerName}] Received task ${task.id} (complexity=${task.complexity}) — processing...`);

        // Simula procesamiento (1..5 segundos según complejidad)
        const trabajoMs = task.complexity * 1000;
        setTimeout(() => {
          console.log(`[${workerName}] Done task ${task.id} (took ${task.complexity}s) — acking`);
          ch.ack(msg); // ack manual: garantiza que la tarea no se pierde
        }, trabajoMs);

      }, { noAck: false });
    });

    // manejar cierre accidental de conexión
    conn.on('error', (e) => {
      console.error(`[${workerName}] connection error`, e.message || e);
    });
    conn.on('close', () => {
      console.warn(`[${workerName}] connection closed — restarting in 5s`);
      setTimeout(start, 5000);
    });
  });
}

start();

