# Taller RabbitMQ

## Equipo
- Sebastian Cañon  
- Natalia Bernal

## Taller 19 de octubre
Este taller demuestra distintos patrones de mensajería con RabbitMQ y Node.js:
- **distributed-workqueue**: una cola que reparte tareas entre varios workers.
- **fanout-pubsub**: cada mensaje se replica a todos los suscriptores conectados.
- **direct-routing**: los mensajes van a los consumidores que piden una severidad específica.

## Notas sobre la documentación de rabbit mq get started
Para la entrega del lunes 19 de octubre se solicitó implementar el tutorial de RabbitMQ sobre Publish/Subscribe. Tomamos lo construido en este taller y separamos en carpetas para reproducir ese ejemplo: el productor publica mensajes en el exchange `logs` de tipo fanout y cada receptor crea una cola exclusiva, la enlaza al exchange y recibe una copia de cada mensaje. Así demostramos cómo un sistema de logs puede mandarse simultáneamente a múltiples consumidores, tal como describe el tutorial oficial.

## Fiabilidad básica
- Las colas pueden ser duraderas, así que los mensajes sobreviven a un reinicio de RabbitMQ.
- Los workers procesan de a una tarea y confirman con ACK sólo cuando terminan.
- Si un contenedor falla antes del ACK, RabbitMQ devuelve la tarea a la cola para otro worker.
- Agregar o quitar workers no requiere cambios en el productor ni en RabbitMQ.
