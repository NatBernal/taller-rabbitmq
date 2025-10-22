#!/usr/bin/env node
const amqp = require("amqplib/callback_api");

const url = process.env.RABBITMQ_URL || "amqp://localhost";
const exchange = "logs";

// Generamos 10 tareas con complejidades 1..5 (ciclo)
const tasks = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  complexity: (i % 5) + 1,
  message: `Task ${i + 1} - broadcast message`,
}));

amqp.connect(url, (err, conn) => {
  if (err) {
    console.error("Connect error:", err.message || err);
    process.exit(1);
  }
  
  conn.createChannel((err, ch) => {
    if (err) throw err;
    
    ch.assertExchange(exchange, "fanout", { durable: false });
    
    tasks.forEach((task) => {
      const payload = JSON.stringify(task);
      ch.publish(exchange, "", Buffer.from(payload));
      console.log(`[x] Broadcast task ${task.id} (complexity=${task.complexity})`);
    });
    
    setTimeout(() => {
      conn.close();
      process.exit(0);
    }, 500);
  });
});
