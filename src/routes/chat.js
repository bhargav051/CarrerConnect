const express = require("express");
const chatRouter = express.Router();
const Chat = require('../models/chat');
const { userAuth } = require("../middlewares/auth");

chatRouter.get("/chat/:targetUserId", userAuth, async (req,res) => {
    try{
        const userId = req.user._id;
        const targetUserId = req.params.targetUserId;
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
        res.status(200).json({message: "Chat data fetched successfully", chat: chat});
    } catch(err){
        res.status(400).send("Error: "+err.message);
    }
});

module.exports = chatRouter;