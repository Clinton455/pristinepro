const WebSocket = require('ws');
const https = require('https');

const port = process.env.PORT || 3000;

// Keep-alive function
function keepAlive() {
  setInterval(() => {
    // Check if RENDER_EXTERNAL_HOSTNAME is set
    if (process.env.RENDER_EXTERNAL_HOSTNAME) {
      https.get(`https://${process.env.RENDER_EXTERNAL_HOSTNAME}`, (resp) => {
        if (resp.statusCode === 200) {
          console.log('Server kept alive');
        } else {
          console.log('Failed to keep server alive');
        }
      }).on('error', (err) => {
        console.log('Keep-alive error: ', err.message);
      });
    } else {
      console.log('RENDER_EXTERNAL_HOSTNAME not set');
    }
  }, 10 * 60 * 1000); // Run every 10 minutes
}

// Create the WebSocket server
const wss = new WebSocket.Server({ port });

// In-memory storage for slots
let slots = {};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Send current slot data to the newly connected client
    ws.send(JSON.stringify({ type: 'update', slots }));

    // Handle incoming messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Handle update request
            if (data.type === 'update') {
                const { date, slot } = data;

                // Validate the date and slot
                if (date && slot !== undefined) {
                    // Update the slot information for the given date
                    slots[date] = slot;

                    // Broadcast the updated slots to all connected clients
                    broadcast({ type: 'update', slots });
                }
            }
            // Handle delete request
            else if (data.type === 'delete') {
                const { date } = data;

                // Ensure the date exists before trying to delete it
                if (date && slots[date]) {
                    delete slots[date];

                    // Broadcast the updated slots to all connected clients
                    broadcast({ type: 'update', slots });
                }
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });

    // Handle WebSocket errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('A client has disconnected');
    });
});

// Helper function to broadcast messages to all clients
function broadcast(data) {
    // Loop through all clients and send the data
    wss.clients.forEach((client) => {
        // Only send data if the client is still connected
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Start the server and initiate keep-alive
console.log(`WebSocket server is running on port ${port}`);
keepAlive();