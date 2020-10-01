const express = require('express');
const router = express.Router();

const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const { body, validationResult } = require('express-validator');


// @route   GET /api/profile/me
// @desc    Get Current users Profile
// @access  Private
router.get('/me', auth, async(req, res) => {

    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate(['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: "This User has no profile" });
        }
        res.json(profile);

    } catch (err) {
        console.log(err.message);
        return res.status(500).send("Server error");
    }

});


// @route   POST /api/profile
// @desc    Create or update user profile
// @access  Private
router.post('/', [auth, [
    body('status', 
         'Status is Required')
         .not()
         .isEmpty(),
    body('skills', 
         'skills is Required')
         .not()
         .isEmpty(),
]], async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Data From Body Postman
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
    } = req.body;

    // Build Profile Object
    const profileFields = {}
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build Social Object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {

        let profile = await Profile.findOne({ user: req.user.id });
        if(profile) { 
            profile = await Profile.findOneAndUpdate(
                        { user: req.user.id }, 
                        { $set: profileFields },
                        { new: true });

            return res.json(profile);
        }

        // Create Profile
        profile = new Profile(profileFields);
        await profile.save();

        return res.json(profile);

    } catch (err) {
        console.log(err.message)
        return res.status(500).send("server error");
    }

})


// @route   GET /api/profile
// @desc    gets All Profile
// @access  Public
router.get('/', async(req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }
})


// @route   GET /api/profile/user/:user_id
// @desc    get profile by ID
// @access  Public
router.get('/user/:user_id', async(req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

        if(!profile) return res.status(400).json({ msg: "Profile not found" });
        res.json(profile);
    } catch (err) {
        console.log(err.message);
        if(err.kind == "ObjectId") return res.status(400).json({ msg: "Profile not found" });
        return res.send(500).send("server error");
    }
})



// @route   DELETE /api/profile
// @desc    Delete User, Profile, Posts
// @access  Public
router.delete('/', auth, async(req, res) => {
    try {
        // @todo - Remove Posts

        // Remove User
        await User.findOneAndRemove({ _id: req.user.id });

        // Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        return res.json({msg: "User deleted"});
    } catch (err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }
})


// @route   PUT /api/profile/experience
// @desc    Add Experience
// @access  Private
router.put('/experience', [auth, [
    body('title', 
         'title is Required')
         .not()
         .isEmpty(),
    body('company', 
         'company is Required')
         .not()
         .isEmpty(),
    body('from', 
         'from is Required')
         .not()
         .isEmpty(),
]], async(req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    }

    try {

        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
    }
})

// @route   DELETE /api/profile/experience/:exp_id
// @desc    Delete experience on Some profile 
// @access  private
router.delete('/experience/:exp_id', auth, async(req, res) => {
    try {

        // Remove Profile Experience
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);
        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }
})




// @route   PUT /api/profile/education
// @desc    Add education
// @access  Private
router.put('/education', [auth, [
    body('school', 
         'school is Required')
         .not()
         .isEmpty(),
    body('degree', 
         'degree is Required')
         .not()
         .isEmpty(),
    body('fieldofstudy', 
         'fieldofstudy is Required')
         .not()
         .isEmpty(),
    body('from', 
         'from is Required')
         .not()
         .isEmpty(),
]], async(req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    }

    try {

        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
    }
})

// @route   DELETE /api/profile/education/:edu_id
// @desc    Delete education on Some profile 
// @access  private
router.delete('/education/:edu_id', auth, async(req, res) => {
    try {

        // Remove Profile education
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);
        await profile.save();

        return res.json(profile);
    } catch (err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }
})


// @route   DELETE /api/profile/github/:username
// @desc    Get User Repos from github
// @access  public

router.get('/github/:username', (req, res) => {
    try {

        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}}`,
            method: 'GET',
            headers: {'user-agent': 'node.js'}
        }

        request(options, (error, response, body) => {
            if (error) console.log(error);

            if (response.statusCode != 200) {
                return res.status(404).json({ msg: "No github profile found" });
            }

            return res.json( JSON.parse(body) );

        })

    } catch (err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }
})

module.exports = router;