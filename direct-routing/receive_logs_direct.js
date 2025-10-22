#!/usr/bin/env node
const amqp = require("amqplib/callback_api");

const url = process.env.RABBITMQ_URL || "amqp://localhost";
const exchange = "direct_logs";
const consumerName = process.env.CONSUMER_NAME || process.env.HOSTNAME || "consumer";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: receive_logs_direct.js [info] [warning] [error]");
  process.exit(1);
}

function start() {
  amqp.connect(url, (err, conn) => {
    if (err) {
      console.error(
        `[${consumerName}] connect error: ${err.message || err}. retrying in 5s`
      );
      return setTimeout(start, 5000);
    }
    
    conn.createChannel((err, ch) => {
      if (err) throw err;
      
      ch.assertExchange(exchange, "direct", { durable: false });
      
      // Cola temporal y exclusiva
      ch.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;
        
        console.log(`[${consumerName}] Waiting for tasks with severities: ${args.join(", ")}`);
        
        // Bind cola al exchange con cada severity
        args.forEach((severity) => {
          ch.bindQueue(q.queue, exchange, severity);
        });
        
        ch.consume(
          q.queue,
          (msg) => {
            if (msg) {
              const task = JSON.parse(msg.content.toString());
              console.log(
                `[${consumerName}] Received [${msg.fields.routingKey}] task ${task.id} (complexity=${task.complexity}) — processing...`
              );
              
              // Simula procesamiento (1..5 segundos según complejidad)
              const trabajoMs = task.complexity * 1000;
              setTimeout(() => {
                console.log(
                  `[${consumerName}] Done [${task.severity}] task ${task.id} (took ${task.complexity}s)`
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
      console.error(`[${consumerName}] connection error`, e.message || e);
    });
    
    conn.on("close", () => {
      console.warn(`[${consumerName}] connection closed — restarting in 5s`);
      setTimeout(start, 5000);
    });
  });
}

start();
