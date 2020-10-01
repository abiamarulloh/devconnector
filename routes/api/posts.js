const express = require('express');
const router = express.Router()

const auth = require('../../middleware/auth');
const { body, validationResult} = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST /api/posts
// @desc    Create Post
// @access  Private
router.post('/', [auth, [
    body('text', 'text is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select("-password");
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });
    
        const post = await newPost.save();
    
        return res.json(post);
    } catch(err) {
        console.log(err.message);
        return res.send(500).send("server error");
    }

});

module.exports = router;