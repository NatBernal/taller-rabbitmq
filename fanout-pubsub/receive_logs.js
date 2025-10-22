#!/usr/bin/env node
const amqp = require("amqplib/callback_api");

const url = process.env.RABBITMQ_URL || "amqp://localhost";
const exchange = "logs";
const workerName = process.env.WORKER_NAME || "worker";

function start() {
  amqp.connect(url, (err, conn) => {
    if (err) {
      console.error(
        `[${workerName}] connect error: ${err.message || err}. retrying in 5s`
      );
      return setTimeout(start, 5000);
    }
    
    conn.createChannel((err, ch) => {
      if (err) throw err;
      
      ch.assertExchange(exchange, "fanout", { durable: false });
      
      ch.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;
        
        console.log(`[${workerName}] Waiting for broadcast tasks in ${q.queue}...`);
        
        ch.bindQueue(q.queue, exchange, "");
        
        ch.consume(
          q.queue,
          (msg) => {
            if (msg && msg.content) {
              const task = JSON.parse(msg.content.toString());
              console.log(
                `[${workerName}] Received task ${task.id} (complexity=${task.complexity}) — processing...`
              );
              
              const trabajoMs = task.complexity * 1000;
              setTimeout(() => {
                console.log(
                  `[${workerName}] Done task ${task.id} (took ${task.complexity}s)`
                );
              }, trabajoMs);
            }
          },
          { noAck: true }
        );
      });
    });
    
    // Manejo de errores y reconexión
    conn.on("error", (e) => {
      console.error(`[${workerName}] connection error`, e.message || e);
    });
    
    conn.on("close", () => {
      console.warn(`[${workerName}] connection closed — restarting in 5s`);
      setTimeout(start, 5000);
    });
  });
}

start();
