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
        return res.status(500).send("server error");
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
        return res.status(500).send("server error");
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

// @route   PUT /api/posts/like/:post_id
// @desc    PUT Like POST
// @access  Private
router.put('/like/:post_id', auth, async(req, res) => {
    try { 

        post = await Post.findById({ _id: req.params.post_id });
    
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0 ) {
            return res.status(400).json({ msg: "Post Already likes" });
        }

        post.likes.unshift({ user: req.user.id});

        await post.save();
        return res.json(post.likes);


    } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
    }
})


// @route   PUT /api/posts/unlike/:post_id
// @desc    PUT unlike POST
// @access  Private
router.put('/unlike/:post_id', auth, async(req, res) => {
    try { 

        post = await Post.findById({ _id: req.params.post_id });

        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0 ) {
            return res.status(400).json({ msg: "Post Has not yet been likes" });
        }

        // Get Remove Index
        let removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();
        return res.json(post.likes);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send("server error");
    }
})

// @route   post /api/posts/comments/:post_id
// @desc    Create Comment Post
// @access  Private
router.post('/comments/:post_id', [auth, [
    body('text', 'text is required').not().isEmpty()
]], async(req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select("-password");

        const post = await Post.findById({ _id: req.params.post_id });

        if(!post) {
            return res.status(400).json({ msg: "Post not found" });
        }

        const newPostComments = {
            user: req.user.id,
            text: req.body.text,
            name: user.name,
            avatar: user.avatar
        };

        post.comments.unshift(newPostComments);

        await post.save();
        return res.json(post.comments);

    } catch(err) {
        console.log(err.message);
        if(err.kind == "ObjectId") return res.status(400).json({ msg: "Post not found" })
        return res.status(500).send("server error");
    }

});


// @route   Delete /api/posts/comments/:post_id/:comment_id
// @desc    Delete Comment Post
// @access  Private
router.delete('/comments/:post_id/:comment_id', auth, async(req, res) => {
    try {

        const post = await Post.findById(req.params.post_id);

        // Pull Out Comment
        const comment = await post.comments.find(comment => comment.id == req.params.comment_id);

        if(!post) return res.status(400).json({ msg: "Post not found" });

        // Make Sure Comment Exists
        if(!comment) return res.status(400).json({ msg: "Comment Does not Exists" });

        // Check User
        if(comment.user.toString() != req.user.id ) {
            return res.status(401).json({ msg: "user not authorized" });
        }

        const removeIndex = post.comments
        .map(comment => comment.id.toString())
        .indexOf(req.params.comment_id)

        post.comments.splice(removeIndex, 1);
        await post.save();
        return res.json(post.comments);

    } catch (err) {
        console.log(err.message);
        if(err.kind == "ObjectId") return res.status(400).json({ msg: "Post Does not Exists" })
        return res.status(500).send("server error");
    }
})

module.exports = router;