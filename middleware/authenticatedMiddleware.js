const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')

const auth = async (req,res,next) => {
    //check header
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        throw new UnauthenticatedError('Authentication Invalid')
    }
    const token = authHeader.split(' ')[1]

    try {
        const payload = jwt.verify(token,process.env.JWT_SECRET)
        //attach the user to the job routes
        //const user = User.findById(payload.userID).select('-password')  //line 16,17 is instead
        //req.user = user                                                 //of line 18
        const testUser = payload.userID === '675a8ced23a68a0f6a261133'
        req.user = {userID:payload.userID,testUser}
        next()
    } catch (error) {
        throw new UnauthenticatedError('Authentication Invalid')
    }
}

module.exports = auth