const socket = require('socket.io');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

const getHashedRoomId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort().join("_");
    return crypto.createHash('sha256').update(sortedIds).digest('hex');
}

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://carrer-connect-web.vercel.app"
            ],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        console.log("🔐 Verifying socket token:", token);

        if (!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized"));
        }

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user; // store user data in socket
            next();
        } catch (err) {
            console.log(err.message);
            return next(new Error("Unauthorized"));
        }
    })

    io.on("connection", (socket) => {
        // handle events
        socket.on("joinChat", ({ userId, targetUserId }) => {
            const room = getHashedRoomId(userId, targetUserId);
            socket.join(room);
        });

        socket.on("sendMessage", ({ firstName, from, to, text }) => {
            const room = getHashedRoomId(from, to);
            io.to(room).emit("messageReceived", { firstName, text });
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user._id);
            // Handle user disconnection (e.g., remove from rooms)
            const rooms = Object.keys(socket.rooms);
            rooms.forEach((room) => {
                socket.leave(room);
            });
        });
    })
}

module.exports = initializeSocket; 