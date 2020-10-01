const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route   POST /api/users
// @desc    Registration User
// @access  Public
router.post('/', [
    // Name is required
    body('name', 
         'Name is Required')
         .not()
         .isEmpty(),
    // email valid
    body('email', 
         'Please Include a valid email')
         .isEmail(),
    // password must be at least 6 chars long
    body('password', 
         'Please enter a password with 6 or more characters')
         .isLength({ min: 6 })
], async(req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }


    const { name, email, password } = req.body;

    try {
        // See if user exists
        let user = await User.findOne({ email });

        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists'}]})
        }
    
        // Get Users Gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        })

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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