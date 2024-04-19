const express = require('express')
const router = express.Router()
const User = require('../Models/User')
const Club = require('../Models/Club')
const auth = require('../middleware/auth')


router.post("/", auth(), async (req, res) => {
  const { requester } = res.locals;

  try {
      const clubData = await User.findOne({
          msId: requester.user.localAccountId,
      });

      if (clubData) {
          // Ensure email is updated only if different or not set
          if (!clubData.email || clubData.email !== requester.user.username) {
              clubData.email = requester.user.username || 'default@example.com'; // Provide a fallback email if necessary
              await clubData.save(); // Save changes
          }
        
          return res.json({ ...requester, clubData });
      } else {
          // Create new user ensuring email is never undefined
          const newUser = new User({
              msId: requester.user.localAccountId,
              name: requester.user.name,
              email: requester.user.username || 'default@example.com' // Provide a fallback email if necessary
          });
         
          await newUser.save();
          return res.json({ ...requester, newUser });
      }

  } catch (err) {
      
      return res.status(500).json({'errors': [{"msg": "Server Error"}]});
  }
});



router.post('/clubs', auth(), async(req, res) => {
 try{
    const {requester} = res.locals
    const msId = req.body.msId
    const clubUser = await User.findOne({
      msId: msId
    });
    const clubs = await Club.find({_id: {$in: clubUser.clubs}})

    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})


router.get('/clubAnnouncements', auth(), async(req, res) => {

  const {requester} = res.locals

  try{
    const clubUser = await User.findOne(requester._id)

    const clubs = await Club.find({_id: {$in: clubUser.clubs}})



    const announcements = await Announcement.find({_id : {$in: club.announcements}})


    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})

module.exports = router