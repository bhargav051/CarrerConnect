const cron = require('node-cron');
const Connections = require('../models/connectionRequest');
const { subDays, startOfDay, endOfDay } = require('date-fns');
const sendMail = require('./sendMail');


cron.schedule('* 8 * * *', async () => {
    console.log('Cron job executed at 8 AM: ' + new Date().toISOString());
    try{
        const yesterday = subDays(new Date(), 1);
        const start = startOfDay(yesterday);
        const end = endOfDay(yesterday);
        const pendingConnections = await Connections.find({
            status: 'interested',
            createdAt: { $gte: start, $lte: end } 
        }).populate('fromUserId', ['firstName', 'lastName', 'emailId'])
          .populate('toUserId', ['firstName', 'lastName', 'emailId']);

        const listOFEmailIDs = [...new Set(pendingConnections.map(conn => conn.toUserId.emailId))];

        // Here, you would typically send emails to the users in listOFEmailIDs
        console.log('Users to notify:', listOFEmailIDs);
        for(const emailId of listOFEmailIDs){
            try{
                const res = await sendMail(
                    emailId, 
                    "Pending Connection Requests", 
                    "You have pending connection requests from yesterday.", 
                    `<p>Dear User,</p><p>You have pending connection requests from yesterday. Please log in to your account to respond to them.</p>`
                );
            } catch(err){
                console.error(`Error sending email to ${emailId}:`, err.message);
            }
        }
    } catch(err){
        console.error('Error executing cron job at 8 AM:', err.message);
    }
});

module.exports = cron;