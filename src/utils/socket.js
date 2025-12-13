const socket = require('socket.io');
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const Chat = require('../models/chat');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');

const getHashedRoomId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort().join("_");
    return crypto.createHash('sha256').update(sortedIds).digest('hex');
}

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://career-connect-web.vercel.app"
            ],
            credentials: true,
        }, 
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.log("Socket connection rejected: No token provided");
            return next(new Error("Unauthorized"));
        }

        try {
            const decodedMessage = jwt.verify(token, process.env.JWT_SECRET);
            console.log("decoded message:", decodedMessage);
            const userId = decodedMessage._id;
            socket.userId = userId; // store user data in socket
            // find the user from DB and set isOnline to true
            await User.findByIdAndUpdate(userId, {
                isOnline: true,
                lastSeen: new Date(),
            });
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

        io.emit("userOnline", socket.userId);

        socket.on("sendMessage", async ({ firstName, lastName, from, to, text }) => {
            try {
                // check if both users are friends
                const connection = await ConnectionRequest.findOne({
                    $or: [
                        { fromUserId: from, toUserId: to, status: "accepted" },
                        { fromUserId: to, toUserId: from, status: "accepted" }
                    ]
                });

                if(!connection){
                    console.log("Users are not connected. Message not sent.");
                    return;
                }

                const room = getHashedRoomId(from, to);
                // save message to DB
                let chat = await Chat.findOne({
                    participants: { $all: [from, to] },
                });
                if (!chat) {
                    const newChat = new Chat({
                        participants: [from, to],
                        messages: [{ sender: from, text }]
                    });
                    await newChat.save();
                } else {
                    chat.messages.push({ sender: from, text });
                    await chat.save();
                }
                io.to(room).emit("messageReceived", { firstName, lastName, from, text });
            } catch (err) {
                console.error("Error:", err);
            }
        });

        socket.on("disconnect", async() => {
            console.log("User disconnected:", socket.userId);
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date(),
            });
            io.emit("userOffline", socket.userId);
        });
    })
}

module.exports = initializeSocket; 