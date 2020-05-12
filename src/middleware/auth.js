const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async (req, res, next) => {

    try {
        
        // on extrait le token du header
        const token = req.header('Authorization').replace('Bearer ' , '');
        // on verifie si c'est le bon token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //on chope a qui appartien ce token
        const user = await User.findOne({_id: decoded._id , 'tokens.token' : token});

        if(!user){
            throw new Error()
        }
         
        req.token = token;
        req.user = user;

        next();
        
    } catch (error) {
        res.status(401).send({error : 'Please authenticate'});
    }

};

module.exports = auth