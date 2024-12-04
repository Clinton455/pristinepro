const WebSocket = require('ws');
const port = process.env.PORT || 3000;

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

console.log('WebSocket server is running on port ${port}');
