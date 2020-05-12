const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const  Task = require('../models/task');




const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        unique : true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password can not contain "password"')
            }
        }
    },

    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },

    avatar: {
        type: Buffer
    },

    tokens : [{
        token:{
            type:String,
            required:true
        }
    }],
    
}, {
    timestamps: true
});

// Relation virtuelle entre le user et les taches (task) qu'il a crée
userSchema.virtual('tasks', {
    ref : 'Task',
    localField : '_id',
    foreignField : 'owner'
});

/**
 * Methode qui nous permet d'afficher les données qu'on veut sur un utilisateur
 */
userSchema.methods.toJSON =  function () {
    const user = this;

    // On recupere tout l'objet user
    const userObject = user.toObject();

    // on supprime sur le user les propriétes qu'on veut pas
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;

}

/**
 * Methode qui permet de generer le token
 * les "methods" st accessible sur les instances
 */
userSchema.methods.generateAuthToken = async  function() {
    const user = this;
    //on genere le token;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    // on attribue le token au user
    user.tokens = user.tokens.concat({token});
    
    // on enregistre le user avec son token
    await user.save();

    return token;
}


/**
 * Methode qui permet de rechercher un user par son email et son password
 * statics methode sont accessible sur le model et on les appelle "model method"
 */

userSchema.statics.findByCredentials = async (email, password) => {

    // on recherche d'abord par email
    const user = await User.findOne({email});

    if(!user){
        throw new Error('Enable to login');
    }

    /**
     * on recherche par password
     * compare par deux arguments , le premier c'est le mot de pass entré par le user et le second le mot de pass haché ds la bdd: il nous retoune true ou false
     */

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('Enable to login');
    }
    return user; 
}



 // Pour hasher le mot de passe avant d'enregistrer en bdd
userSchema.pre('save', async function(next){

    const user = this ;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next();
});

// Pour supprimer les taches associées a un user qui est supprimé
userSchema.pre('remove', async function(next){
    const user = this;
    
    await Task.deleteMany({owner: user._id});
    next();

});


const User = mongoose.model('User',userSchema );

module.exports = User