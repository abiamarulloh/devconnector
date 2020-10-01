const express = require('express');
const router = express.Router()
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { body, validationResult } = require('express-validator');

// @route   GET /api/auth
// @desc    Test Route
// @access  Public
router.get('/', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        console.log(err.message);
        return res.status(500).json("Server Error")
    }
});


// @route   POST /api/auth
// @desc    Authenticate User & get Token
// @access  Public
router.post('/', [
    // email valid
    body('email', 
         'Please Include a valid email')
         .isEmail(),
    // password must be at least 6 chars long
    body('password', 
         'Please enter a valid password')
         .exists()
], async(req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // See if user exists
        let user = await User.findOne({ email });

        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}]})
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials'}]});
        }

        // return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'),
                { expiresIn: 3600 },
                (err, token) => {
                    if(err) throw err;
                    res.json({ token });
                }
        );

    }catch(err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;