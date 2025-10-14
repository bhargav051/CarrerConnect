const express = require("express");
const userRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");


// get all pending request from the user
userRouter.get("/user/requests", userAuth, async (req,res) => {
    try{
        const loggedInUser = req.user;
        
        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status:"interested"
        }).populate("fromUserId",["firstName","lastName","age","gender","about","skills"]);

        res.json({
            meessage: "connection requests Fetch successfully !!",
            data: connectionRequests
        });

    } catch(err){
        res.status(400).send("Error: "+err.messaege);
    }
});

// get all connections
userRouter.get("/user/connections", userAuth, async (req,res) => {
    try{
        const loggedInUser = req.user;
        const Connections = await ConnectionRequest.find({
            $or: [
                {fromUserId: loggedInUser._id, status: "accepted"},
                {toUserId: loggedInUser._id, status: "accepted"}
            ]
        }).populate("fromUserId",["firstName","lastName","age","gender","about","skills"])
        .populate("toUserId",["firstName","lastName","age","gender","about","skills"]);

        const formatedConnections = Connections.map(conn => {
            const otherUser = conn.fromUserId._id.equals(loggedInUser._id)
                ? conn.toUserId
                : conn.fromUserId

            return otherUser;
        });

        res.json({
            meessage: "connections Fetched successfully !!",
            data: formatedConnections
        });
    }catch(err){
        res.status(400).send("Error: "+err.meessage);
    }
});

// very important , can be interview question (system design)
userRouter.get("/user/feed", userAuth, async(req, res) => {
    try{
        const loggedInUser = req.user;
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        // sanitize data
        limit = limit>50? 50: limit;
        const skip = (page-1)*limit;

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                {fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id},
            ]
        }).select(["fromUserId","toUserId"]);

        // using set datastructure to store unique id's
        const hideUsersFromFeed = new Set();

        connectionRequests.forEach((req) => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });

        const userFeed = await User.find({
            $and: [
                {_id: {$nin: Array.from(hideUsersFromFeed)}},
                {_id: {$ne: loggedInUser._id}},
            ],
        }).select(["firstName", "lastName", "age", "gender", "about", "skills"])
        .skip(skip)
        .limit(limit);

        res.status(200).json({Message:"feed fetched successfully!!",
            Data: userFeed
        });
        
    }catch(err){
        res.status(400).send("Error: "+err.messaege);
    }
})

module.exports = userRouter;