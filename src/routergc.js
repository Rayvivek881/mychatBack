const express = require("express");
const routerGC = new express.Router();
const GroupChat = require('../models/groupChatting');
const Authentication = require('./middleware/authentication');
const UserData = require('../models/auth');

routerGC.get('/creategroup', Authentication, async (req, res) => {
    const {myid, fullname} = req.user, {groupName} = req.query;
    console.log(req.query);
    const newGroup = GroupChat({
        groupName: groupName,
        Admin: JSON.stringify([fullname, myid]), 
    });
    const result = await newGroup.save();
    const result1 = await UserData.updateOne({_id: myid}, {
        $push: {
            groups: JSON.stringify([result._id, groupName])
        }
    }, { useFindAndModify: false });
    res.send({addit: [result._id, groupName]});
})

routerGC.get('/groupreq', Authentication, async(req, res) => {
    const {myid, fullname} = req.user, {groupid} = req.query;
    console.log(req.query);
    const data = await GroupChat.findById(groupid).select({Admin: true, groupName: true})
    const result = await GroupChat.updateOne({_id: groupid}, {
        $addToSet: {
            requests: JSON.stringify([myid, fullname])
        }
    }, { useFindAndModify: false });
    const result1 = await UserData.updateOne({_id: JSON.parse(data.Admin)[1]}, {
        $push: {
            notifications: JSON.stringify([myid, `${fullname} has sent you a group Add request 
            for ${data.groupName} you can watch his profile by clicking on me`])
        },
        $inc: {newnotifications: 1}
    })
    res.send({});
}) 

routerGC.get('/addgroupreq', Authentication, async(req, res) => {
    const {groupid, friendid, name, groupName, Adminid} = req.query;
    const result = await GroupChat.updateOne({id: groupid}, {
        $push: {
            requests: JSON.stringify([friendid, name])
        }
    }, { useFindAndModify: false });
    const result1 = await UserData.updateOne({_id: JSON.parse(Adminid)[1]}, {
        $inc: {newnotifications: 1},
        $push: {notifications: JSON.stringify([friendid, `${name} has send you to group add request you can watch his profile by clicking on me`])}
    })
    res.send({});
})


routerGC.put('/addmember', Authentication, async(req, res) => {
    const {myid, fullname} = req.user;
    const {groupid, friendid, name, groupName} = req.body;
    const result = await GroupChat.updateOne({_id: groupid}, {
        $pull: {
            requests: JSON.stringify([friendid, name])
        }, 
        $addToSet: {
            members: JSON.stringify([friendid, name])
        }
    }, { useFindAndModify: false });
    const result2 = await UserData.updateOne({_id: friendid}, {
        $push: {
            groups: JSON.stringify([groupid, groupName]),
            notifications: JSON.stringify([myid, `you have add in group ${groupName} by the admin of this group
            you can watch his profile`])
        }
    }, { useFindAndModify: false });
    res.send({}); 
})

routerGC.get('/groupquery/:groupid', Authentication, async(req, res) => {
    console.log('working...........');
    const result = await GroupChat.findById(req.params.groupid);
    res.send({result: result})
});

routerGC.get('/quitgroup', Authentication, async (req, res) => {
    const {myid, fullname} = req.user, {groupid, groupNmae} = req.query;
    console.log('quiting......');
    const result = await GroupChat.updateOne({_id: groupid}, {
        $pull: {
            members: JSON.stringify([myid, fullname])
        }
    }, { useFindAndModify: false });
    const result1 = await UserData.updateOne({_id: myid}, {
        $pull: {
            groups: JSON.stringify([groupid, groupNmae])
        }
    }, { useFindAndModify: false });
    res.send({});
})

routerGC.post('/sendgm', Authentication, async(req, res) => {
    const {messageid, message} = req.body, {myid, fullname} = req.user;
    const result = await GroupChat.updateOne({_id: messageid}, {
        $push: {
            messages: JSON.stringify([myid, fullname, message])
        }
    },{ useFindAndModify: false });
    res.send({});
});

routerGC.get('/rmmember', Authentication, async(req, res) => { 
    const {myid, fullname} = req.user, {groupid, member} = req.query;
    console.log(req.query);
    const result = await GroupChat.updateOne({_id: groupid}, {
        $pull: {
            members: member
        }
    }, { useFindAndModify: false });
    res.send({});
});

routerGC.post('/editgroup', async(req, res) => {
    const {groupName, image, status, groupid} = req.body;
    console.log(req.body);
    const result = await GroupChat.updateOne({_id: groupid}, {
        $set: {
            groupName: groupName,
            image: image,
            status: status
        }
    }, { useFindAndModify: false });
    res.send({})
})

module.exports = routerGC; 