const express = require('express')
const router = express.Router()
const User = require('../Models/User')
const Club = require('../Models/Club')
const auth = require('../middleware/auth')


router.get("/", auth(), async (req,res)=>{

    const {requester} = res.locals

    try{
      const clubData = await User.findById(requester._id) 

      if(clubData){


        return res.json({...requester, clubData})
      } else {

        const newUser = new User({_id: requester._id})
        newUser.save()
        return res.json({...requester, newUser})
      }

    } catch(err){
      return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
    }
    

})

router.get('/clubs', auth(), async(req, res) => {

  const {requester} = res.locals

  try{
    const clubUser = await User.findById(requester._id)

    const clubs = await Club.find({_id: {$in: clubUser.clubs}})

    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})

router.get('/clubAnnouncements', auth(), async(req, res) => {

  const {requester} = res.locals

  try{
    const clubUser = await User.findById(requester._id)

    const clubs = await Club.find({_id: {$in: clubUser.clubs}})



    const announcements = await Announcement.find({_id : {$in: club.announcements}})


    res.json(clubs)
  } catch (err) {
    return res.json({'errors': [{"msg": "Server Error"}]}).status(500)
  }

})

module.exports = router