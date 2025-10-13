const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");

const requestRouter = express.Router();

requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        // status validation
        const allowedStatus = ["ignore", "interested"];
        const validStatus = allowedStatus.includes(status);
        if (!validStatus) {
            throw new Error("Status can eiteher be interested or ignored !!");
        }

        // toUserId validation
        const toUser = await User.findById(toUserId);
        if(!toUser){
            throw new Error("toUserId is not valid !!");
        }

        // check if from and to userId are not same
        if(fromUserId.equals(toUserId)){
            throw new Error("You cannot sent connection request to yourself"); 
        }

        // check if there is and existing connection requests
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                {fromUserId, toUserId},
                {fromUserId:toUserId, toUserId:fromUserId}
            ],
        })
        if(existingConnectionRequest){
            throw new Error("Connection request already exists");
        }

        // creating new instance of connectionRequestModel
        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status
        });

        const data = await connectionRequest.save();

        res.json({
            message: "Connection request send successfully",
            data: data
        });

    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
})

requestRouter.post("/request/review/:status/:requestId", userAuth, async (req,res) => {
    try{
        const loggedInUser = req.user;
        const { status, requestId } = req.params;

        // validating the 
        const allowedStatus = ["accepted", "rejected"];
        if(!allowedStatus.includes(status)){
            throw new Error("Status is invalid !!");
        }

        // check if connection request is valid
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: "interested"
        })

        if(!connectionRequest) {
            return res.status(404).json({ message: "Connection Request not found !!"});
        }

        connectionRequest.status = status;
        const data = connectionRequest.save();

        res.status(200).json({
            message: "Connection request "+ status,
            data: data
        });
    } catch(err) {
        res.status(400).send("Error: "+err.message);
    }
});

module.exports = requestRouter;