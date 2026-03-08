import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("Connected to server...");
});

socket.on("heatmap_update", (data) => {
    console.log("Received heatmap_update! Array Length:", data?.length);
    if (data?.length > 0) {
        console.log("Example Sector:", data[0].name, "Stocks:", data[0].children?.length);
    }
    process.exit(0);
});

setTimeout(() => {
    console.log("Timeout waiting for heatmap_update.");
    process.exit(1);
}, 65000);
