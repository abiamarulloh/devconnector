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


// @route   GET /api/posts/
// @desc    GET All Post
// @access  Private
router.get('/', auth, async(req, res) => {
    try {
        const post = await Post.find().sort({ date: -1 });
        return res.json(post);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
    }
})

// @route   GET /api/posts/:post_id
// @desc    GET POST By Post ID
// @access  Public
router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById({ _id: req.params.post_id });
        
        if(!post) return res.status(400).json({ msg: "Post not found" });
        
        return res.json(post);

    } catch (err) {
        console.log(err.message);
        if(err.kind == "ObjectId") return res.status(400).json({ msg: "Post not found" });
        return res.send(500).send("server error");
    }
})

// @route   DELETE /api/posts/:post_id
// @desc    delete POST By Post ID
// @access  Private
router.delete('/:post_id', auth, async(req, res) => {
    try {
        const post = await Post.findById( req.params.post_id );

        if(!post) {
            return res.status(400).json({ msg: "Post not found" });
        }

        // Check User
        if( post.user.toString() != req.user.id ) {
            return res.status(401).json({ msg: "user not authorized" });
        }

        await post.remove()
        return res.json({msg: "User deleted"});
    } catch (err) {
        console.log(err.message);
        if(err.kind == "ObjectId") return res.status(400).json({ msg: "Post not found" });
        return res.status(500).send("server error");
    }
})

module.exports = router;