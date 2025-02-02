const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authenticatedMiddleware')
const testUser = require('../middleware/testUser')

const rateLimiter = require('express-rate-limit')
const apiLimiter = rateLimiter({
    windowMs: 15*60*1000,   //15 minutes
    max: 10,
    message: {
        msg: 'Too many request from this IP, please try again after 15 minutes',
    },
})

const { register,login,updateUser } = require('../controller/auth')

router.post('/register',apiLimiter,register)
router.post('/login',apiLimiter,login)
router.patch('/updateUser',authenticateUser,testUser,updateUser)

module.exports = router