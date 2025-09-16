/**
 * local server entry file, for local development
 */
import { createServer } from 'http';
import app from './app.js';
import CommunicationService from './services/communicationService.js';
import { DatabaseConnection } from './database/connection.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Initialize database connection
const db = DatabaseConnection.getInstance();

// Initialize communication service with Socket.io
const communicationService = new CommunicationService(server);

// Make communication service available to routes
app.set('communicationService', communicationService);

// Start server
server.listen(PORT, async () => {
  try {
    // Ensure database is connected
    await db.connect();
    console.log(`✅ Server ready on port ${PORT}`);
    console.log(`✅ Socket.io server initialized`);
    console.log(`✅ Database connected`);
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;