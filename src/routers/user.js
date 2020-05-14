const express = require('express');
const multer = require('multer');
const sharp = require('sharp')
const User = require('../models/users')
const auth = require('../middleware/auth');
const { sendWelcomeMail, sendDeleteMail} = require('../emails/account');
const router = new express.Router();


router.post('/users', async (req, res) => {
    // on crée un nouveau user
    const user = new User(req.body);
    try {
        // on enregistre le user
        await user.save();
        
        // on envoit un mailde bienvenu
        sendWelcomeMail(user.email,user.name);

        // generateur de token
        const token = await user.generateAuthToken();
        
        // on renvoit une response avec le user
        res.status(201).send({user , token})
    } catch (error) {
        res.status(400).send(error)
    }

});

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({
            user,
            token
        });

    } catch (error) {
        res.status(400).send(error)
    }
});

router.post('/users/logout', auth, async(req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            // token.token = l'object token et la propriété token
            // req.token = le token que je suis entrain d'utiliser
            return token.token !== req.token
        });

        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send()
    }
});

router.post('/users/logoutAll', auth, async(req, res) =>{
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users/me', auth , async (req, res) => {
    
   res.send(req.user);
    
});


router.patch('/users/me', auth, async (req, res) => {

    // on veut s'assuser que le client ne update pas ce qui n'existe pas
    const updates = Object.keys(req.body); // ca convertit notre tableau d'objet en  un tableau de ts nos propiétes en string
    const allowedUpdates = ['age', 'name', 'eamil', 'password'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update)
    });

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' })
    }
    try {
        
        // je loop a travers mon array de string (propriété) et je update
        updates.forEach((update) => req.user[update] = req.body[update]);

        // je save mon nouveau user
       await  req.user.save();
       
        res.send(req.user);

    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/users/me',auth, async (req, res) => {

    try {
        
        // on delete le user
       await req.user.remove();

       //on envoit le mail
       sendDeleteMail(req.user.email, req.user.name);

       //on envoit une response
        res.send(req.user);

    } catch (error) {
        res.status(500).send(error);
    }

}); 

const upload = multer({
   
    limits:{
        fileSize: 1000000
    },

    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
         
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    //on convertit toutes les images en (png) et on les redimensionne avec le package sharp
    const buffer = await sharp(req.file.buffer).resize({width: 250 , height: 250}).png().toBuffer()
    // on mets l'image sur le field avatar du user
    req.user.avatar = buffer
    // on enregistre en bdd
    await req.user.save()
    // on affiche sur postman
    res.send(req.user)
}, (error, req, res, next) => {
        res.status(400).send({ error: error.message});
});

router.delete('/users/me/avatar', auth, async(req, res) => {
    //on supprime l'image associé au profil
    req.user.avatar = undefined;
    // on enregistre le user 
    await req.user.save();
    // on envoit une response
    res.send();
});

router.get('/users/:id/avatar', async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(! user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
        
    } catch (error) {
        res.status(400).send()
    }
})


module.exports = router