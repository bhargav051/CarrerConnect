const express = require("express");
const chatRouter = express.Router();
const Chat = require('../models/chat');
const { userAuth } = require("../middlewares/auth");

chatRouter.get("/chat/:targetUserId", userAuth, async (req,res) => {
    try{
        const userId = req.user._id;
        const targetUserId = req.params.targetUserId;

        // get pagination params
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const skip = (page-1)*limit;

        let chat = await Chat.findOne({
            participants: {
                $all : [userId, targetUserId]
            }
        }).populate("messages.sender", ["firstName", "lastName", "photoUrl"]);

        if(!chat){
            const newChat = new Chat({
                participants: [userId, targetUserId],
                messages: []
            });
            await newChat.save();
        }
        
        // sort the messages by createdAt in descending order and apply pagination
        const sortedMessages = chat.messages.sort((a,b) => b.createdAt - a.createdAt);
        
        // caluculate the total pages for frontend to know when to stop requesting more pages
        const totalMessages = chat.messages.length;
        const toalPages = Math.ceil(totalMessages/limit);

        // slice the messages based on pagination
        const paginatedMessages = sortedMessages.slice(skip, skip+limit);

        // reverse the messages to show the latest message at the bottom
        const finalMessages = paginatedMessages.reverse();

        res.json({
            message: "Chat fetched successfully !!",
            chat: {
                _id: chat._id,
                participants: chat.participants,
                messages: finalMessages,
            },
            totalPages: toalPages,
            currentPage: page,
        })
    } catch(err){
        res.status(400).send("Error: "+err.message);
    }
});

module.exports = chatRouter;