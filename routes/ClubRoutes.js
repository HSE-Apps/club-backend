const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const axios = require('axios')
const dotenv = require('dotenv')
const nodemailer = require('nodemailer');

dotenv.config()

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASS // your email password
    },
    tls:{
        rejectUnAuthorized:true
    }
});



const Club = require('../Models/Club')
const Announcement = require('../Models/Announcement')

const auth = require('../middleware/auth')
const clubRole = require('../middleware/clubRole')

const { body, validationResult } = require('express-validator');
const User = require('../Models/User')


const AUTH_API = process.env.AUTH_API


const {isRole ,inClub} = require('../util/clubUtil')


// * Returns all clubs

router.get('/' , async (req, res) => {
    try{

        const clubs = await Club.find()
        res.json(clubs)

    } catch(err) {
        
        console.log(err)
        res.json({'errors': [{"msg": "Server Error"}]}).status(500)
    }
})

// * Returns single club

router.get('/:clubURL',auth(),clubRole(),async(req,res) => {
    try {

        const {club} = res.locals

        res.json(club)

    } catch (err) {

        console.log(err)
        res.json({'errors': [{"msg": "Server Error"}]}).status(500)

    }
})

// * Returns all members of a club as HSE Key Users 

router.get('/:clubURL/members', auth(),clubRole(), async(req,res) => {
    try {

      
        const {club} = res.locals
        console.log(club.members)
        const members = await User.find({ msId: { $in: club.members } });
        const sponsors = await User.find({ msId: { $in: club.sponsors } });
        const officers = await User.find({ msId: { $in: club.officers } });
        const applicant = await User.find({ msId: { $in: club.applicants } });
        // const { data : officers } = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.officers})
        // const { data : members} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.members})
        // const { data : sponsors} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.sponsors})
        // const { data : applicants} = await axios.post(`${AUTH_API}/user/aggregate`, {idList: club.applicants})
        console.log(members)
        res.json({
            sponsors:sponsors,
            officers:officers,
            members:members,
            applicants:applicant
         })

    } catch (error) {

        console.log("failed to get all members of the")
        console.log(error)
        res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})
router.get('/:clubURL/applicants', auth(),clubRole(), async(req,res) => {
    try {

      
        const {club} = res.locals
        const members = await User.find({ msId: { $in: club.applicants } });
        res.json({
            applicants:members,
         })

    } catch (error) {

        console.log("failed to get all members of the")
        console.log(error)
        res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})


// * Sends email announcement to club members with phone number and notifications on

router.post('/:clubURL/announcement', auth(),clubRole(), async(req, res) => {
    try {
        const {club} = res.locals
      
        const emailMessage = {
            from: `${club.name} <clubshse@gmail.com>`, // sender address
            to: "", // list of receivers
            subject: ` Announcement | ${club.name}`, // Subject line
            text: req.body.message, // plain text body
            html: `<b>${req.body.message}</b>` // html body
        };

        const members = await User.find({ msId: { $in: club.members } }, { email: 1 });
        const sponsors = await User.find({ msId: { $in: club.sponsors } }, { email: 1 });
        const officers = await User.find({ msId: { $in: club.officers } }, { email: 1 });
        
        // Initialize emailList with a predefined email
        let emailList = [""];
        
        // Function to add emails from query results to the email list
        const addEmailsToList = (users) => {
            users.forEach(user => {
                if (user.email) {
                    emailList.push(user.email);
                }
            });
        };
        
        // Add emails to the list
        addEmailsToList(members);
        addEmailsToList(sponsors);
        addEmailsToList(officers);
        
  

        // Filtering based on user settings similar to SMS
        // club.settings.emailDisabled.forEach((emailDisabledId) => {
        //     emailList = emailList.filter((email) => !email.equals(emailDisabledId))
        // });

        emailMessage.to = emailList.join(", ");

        // Send email
        let info = await transporter.sendMail(emailMessage);

        console.log('Message sent: %s', info.messageId);

        // Save the announcement in the database as before
        // const announcement = new Announcement({
        //     club: club._id,
        //     seen: [],
        //     message: req.body.message,
        //     senderName: requester.name,
        //     date: Date.now()
        // });

        // club.announcements.push(announcement);
        // await club.save();
        // await announcement.save();
        // res.send(club);
        res.json({message: "Email sent successfully"});

    } catch (err) {
        console.log(err);
        res.status(500).json({'errors': [{"msg": "Server Error"}]});
    }
});



router.get('/:clubURL/announcement', auth(), clubRole({authLevel: 'member'}),  async (req,res) => {
    try {

        const {club, requester} = res.locals

        const announcements = await Announcement.find({_id : {$in: club.announcements}})


        club.save()
        res.json({announcements})


    } catch (err) {
        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})
    }
})



router.put('/:clubURL/announcement', auth(), clubRole({authLevel: 'member'}),  async (req,res) => {
    console.log('marked read')
    try {

        const {club, requester} = res.locals

        club.announcementViewDate = {...club.announcementViewDate, [requester._id] : Date.now()}

        club.save()
        res.json(club)


    } catch (err) {

    }
})

// * User requests to join / joins club

router.post("/:clubURL/members/", auth(), clubRole(), async (req, res) => {
    try {
        const {requester, club} = res.locals
      const msId = req.body.msId; // Extract the string from the request body

      if(!msId){
        return res.status(400).json({'errors': [{"msg": "Please Login"}]})
      }
   
      const user = await User.findOne({
        msId: msId
      });
  
    

    
      if(inClub(club, user.msId)){
        return res.status(400).json({'errors': [{"msg": "Already in club"}]})
    } else if(isRole('applicant',club, user.msId)){
        return res.status(400).json({'errors': [{"msg": "Application pending"}]})
    }

    
    
      
    if(club.settings.autoJoin){
            
        user.clubs.push( new mongoose.Types.ObjectId(club._id))
        club.members.push(user.msId.toString())

    } else {
        
        user.pendingClubs.push( new mongoose.Types.ObjectId(club._id))
        club.applicants.push(user.msId.toString())

    }
      
  
      user.save();
      club.save();
  
      res.json(club);
     } catch (err) {
       console.log("didnot work");
      return res.status(500).json({ errors: [{ msg: "Server Error" }] });
    }
  });
  

// Accepts member into club
router.put('/:clubURL/members/:id/accept', auth(), clubRole(), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToAccept} = req.params

        if(club.members.includes(idToAccept)||club.officers.includes(idToAccept)){
            return res.status(400).json({'errors': [{"msg": "Already in club"}]})
        } 
        
        const userToAccept = await User.findOne({
            msId: idToAccept
          });
      
        
        console.log("userToAccept")
        userToAccept.clubs.push( new mongoose.Types.ObjectId(club._id))
        userToAccept.pendingClubs = userToAccept.pendingClubs.filter((clubID) => !club._id.equals(clubID))

        club.members.push(idToAccept)
        club.applicants = club.applicants.filter((userId) => userId!==idToAccept)

        userToAccept.save()
        club.save()
          console.log(club)
        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})


// Promotes Member

router.put('/:clubURL/members/:id/promote', auth(),clubRole(), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToPromote} = req.params

        if(club.officers.includes(idToPromote)){
            return res.status(400).json({'errors': [{"msg": "You can only promote club members"}]})
        }

        
        club.officers.push(idToPromote)
        club.members = club.members.filter((userId) => userId !== idToPromote);


        club.save()
        console.log(club)
        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})

// Demotes Member

router.put('/:clubURL/members/:id/demote', auth(), clubRole(), async (req, res) => {

    try{

        const {club} = res.locals

        const {id : idToDemote} = req.params


        if(club.members.includes(idToDemote)){
            return res.status(400).json({'errors': [{"msg": "You can only demote club officers"}]})
        }


        club.members.push(idToDemote)
        club.officers = club.officers.filter((userId) => userId !== idToDemote);

        club.save()

        res.json(club)

    } catch(err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }

})


// Kicks User From Club

router.delete('/:clubURL/members/:msId', auth(), clubRole(), async (req, res) => {
    try {
        const { club } = res.locals;
        const { msId: msIdToKick } = req.params;
        
        // Find the user to be kicked based on msId
        const userToKick = await User.findOne({ msId: msIdToKick });

        if (!userToKick) {
            return res.status(400).json({ 'errors': [{ "msg": "User not found" }] });
        }
        console.log(!club.members.includes(userToKick.msId) && !club.officers.includes(userToKick.msId))
        // Check if user is in the club
        if (!club.members.includes(userToKick.msId) && !club.officers.includes(userToKick.msId)) {
            return res.status(400).json({ 'errors': [{ "msg": "You can only kick students in the club" }] });
        }

        // Check if user is a sponsor
        if (club.sponsors.includes(userToKick._id)) {
            return res.status(400).json({ 'errors': [{ "msg": "You can't kick a sponsor" }] });
        }
        console.log(club.sponsors.includes(userToKick._id))

       // Remove the club from the user's club list
        userToKick.clubs = userToKick.clubs.filter(clubID => !club._id.equals(clubID));
        console.log(userToKick.clubs)
        await userToKick.save();

        // // Remove the user from the club's members and officers lists
        club.members = club.members.filter(memberId => !memberId.equals(userToKick._id));
        club.officers = club.officers.filter(officerId => !officerId.equals(userToKick._id));
        await club.save();
        console.log(userToKick)
        res.json(club);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ 'errors': [{ "msg": "Server Error" }] });
    }
});



// User leave route 
router.delete('/:clubURL/members/', auth(), async (req, res, next) => {
    // Extract the user ID from the header
    const userId = req.headers['x-user-id'];
    
    // Attach the user ID to the request object
    req.userId = userId;

    // Call the clubRole middleware with the modified request object
    clubRole({authLevel: 'member'})(req, res, next);
}, async (req, res) => {
    try {

        const {club, requester} = res.locals
        const msId = req.userId;
        console.log(msId);
    
        if (isRole('sponsor', club, msId)) {
            console.log('sponsor')
            return res.status(400).json({'errors': [{"msg": "You can't leave as a sponsor"}]})
        }
        
       

        const user = await User.findOne({
            msId: msId
          });

        user.clubs = user.clubs.filter((clubID) => !club._id.equals(clubID))

        club.members = club.members.filter((memberId) => !(memberId ==msId))
        club.officers = club.officers.filter((memberId) => !(memberId == msId))

        user.save()
        club.save()

        res.json(club)

    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
});


// Toggle SMS for self user

router.put('/:clubURL/settings/sms', auth(), clubRole({authLevel: 'member'}), async(req, res) => {

    try {

        const {club, requester} = res.locals


 

        if(club.settings.smsDisabled.some((id) => id.equals(requester._id))){
            club.settings.smsDisabled = club.settings.smsDisabled.filter((id) => !id.equals(requester._id))
        } else {
            club.settings.smsDisabled.push(new mongoose.Types.ObjectId(requester._id))
        }



        club.save()
 
        res.send(club)

    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})


// Club Update 
// TODO: CLEAN UP ROUTE

router.put('/:clubURL', auth(),clubRole(), async (req,res) => {

    const {club} = res.locals

    const {name, description, getInvolved, color, tags, logo, tagline, contact, titles, settings,displayImg} = req.body

    console.log(req.body)
    console.log(club)

    try{    


            let testClub = {...club, ...req.body}
            
        console.log(displayImg)
            if(name){
                club.name = name
            }

                        
            if(logo){
                club.logo = logo
            }

            if(description){
                club.description = description
            }

            if(getInvolved){
                club.getInvolved = getInvolved
            }

            if(color){
                club.color = color
            }

            if(tags){
                club.tags = tags
            }

            if(tagline){
                club.tagline = tagline
            }   

            if(contact){
                club.contact = contact
            }

            if(titles){
                club.titles = titles
            }

            if(settings){
                club.settings = settings
            }

            if(displayImg){
                club.displayImg = displayImg
            }
            
           
            club.save()
            res.send(club)

    } catch(err) {
        
        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})




// TODO: CLEAN UP ROUTE

router.post('/', 
    auth(),
    [
        body('form.name').notEmpty().withMessage("Please enter a club name"),
        body('form.url').notEmpty().withMessage("Please enter a URL").custom((value, {req}) => value.indexOf(" ") == -1).withMessage("Club ID must not contain spaces"),
        body('form.description').notEmpty().withMessage("Please enter a description"),
        body('form.color').isHexColor().withMessage("Please use a valid color"),
        body("form.tagline").notEmpty().withMessage("Please enter a tagline").isLength({max: 100}).withMessage("Your tagline must be less than 100 characters"),
        body('form.getInvolved').notEmpty().withMessage("Please tell us how students should get involved"),
        body('form.contact.email').notEmpty().withMessage("Please enter an email").isEmail().withMessage("Please enter a valid email"),
    ],
    async (req,res) => {

        const errors = validationResult(req)

        if(errors.array().length > 0){
            return res.status(400).json({'errors': errors.array()})
        }

        const {requester} = res.locals
        const msId = req.body.msId; // Extract the msId from the request body
        const { name, description, getInvolved, url, color, tags, tagline, settings, logo, contact, displayImg } = req.body.form; // Extract the form data from the request body

        if(tags.length == 0){
            return res.status(400).json({'errors': [{"msg": "Please add tags to make your club easily searchable"}]})
        }

        // if(requester.role == "student"){
        //     return res.status(400).json({'errors': [{"msg": "You can't create a club as a student yet"}]})
        // }

        try{
      
            const nameUsed = await Club.findOne({name: name})
            const urlUsed = await Club.findOne({url: url})

            if(nameUsed){
                return res.status(400).json({'errors': [{"msg": "Club name has already been used"}]})
            } else if (urlUsed){
                return res.status(400).json({'errors': [{"msg": "Club URL has already been used"}]})
            } else {
                const clubs = await new Club({name, description, getInvolved, sponsors: [msId.toString()], url: url, color, tags, tagline, settings, logo, contact, displayImg})
                
                const user = await User.findOne({msId: msId});
  
                user.clubs.push(clubs._id)
                user.save()
                clubs.save()
                res.json(clubs)
            }
        } catch(err) {
            console.log(err)
            return res.status(500).json({'errors': [{"msg": "Server Error"}]})
        }
})



router.delete('/:clubURL', auth(), clubRole({authLevel: 'sponsor'}), async(req, res) => {

    try {
        const {club} = res.locals

        await club.remove()
        res.send("Success")
    } catch (err) {

        console.log(err)
        return res.status(500).json({'errors': [{"msg": "Server Error"}]})

    }
})

module.exports = router