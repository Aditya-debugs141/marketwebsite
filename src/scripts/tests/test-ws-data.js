const io = require("socket.io-client").io;
const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("Connected...");
});

socket.on("heatmap_update", (data) => {
    console.log("Received data structure:");
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
});

setTimeout(() => process.exit(1), 60000);
