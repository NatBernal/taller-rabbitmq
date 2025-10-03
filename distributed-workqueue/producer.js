#!/usr/bin/env node
const amqp = require("amqplib/callback_api");

const url = process.env.RABBITMQ_URL || "amqp://localhost";
const queue = "tareas_distribuidas";

// Generamos 10 tareas con complejidades 1..5 (ciclo)
const tasks = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  complexity: (i % 5) + 1,
}));

amqp.connect(url, (err, conn) => {
  if (err) {
    console.error("Connect error:", err.message || err);
    process.exit(1);
  }
  conn.createChannel((err, ch) => {
    if (err) throw err;
    ch.assertQueue(queue, { durable: true });

    tasks.forEach((task) => {
      const payload = JSON.stringify(task);
      ch.sendToQueue(queue, Buffer.from(payload), { persistent: true });
      console.log(`[x] Sent task ${task.id} (complexity=${task.complexity})`);
    });

    setTimeout(() => {
      conn.close();
      process.exit(0);
    }, 500);
  });
});
