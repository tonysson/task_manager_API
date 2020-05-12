const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();


router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task)

    } catch (error) {
        res.status(400).send(error);
    }

});


//GET /tasks?completed=true
//GET/tasks?limit=2&skip=0
//GET/tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if(req.query.completed){
        match.completed = req.query.completed === "true";
    };

    if(req.query.sortBy){
        const parts =req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === "desc" ? -1:1 ;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

    } catch (error) {
        res.status(500).send(error)
    }

});

router.get('/tasks/:id',auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        });

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {

    // on veut s'assuser que le client ne update pas ce qui n'existe pas
    const updates = Object.keys(req.body); // ca convertit notre tableau d'objet en  un tableau de ts nos propiétes en string
    const allowedUpdates = ['completed', 'description'];
    const isValidOperation = updates.every((update) => { 
        return allowedUpdates.includes(update)
    });


    // nous permet de ne pas update une propriété qui n'existe pas
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid update' })
    }

    try {
         
        //  on trouve la tache a modifier
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
       
        // on verifie si on a une tache sinon on envoi une erreur
        if (!task) {
            return res.status(404).send()
        }

        // on loop a travers notre array de propriéte pour fer la mis a jour
        updates.forEach((update) => task[update] = req.body[update])


        // j'enregistre en bdd 
        await task.save();

        
       
        res.send(task);

    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {

    try {
        const task = await Task.findOneAndDelete({
            _id : req.params.id,
            owner: req.user._id
        });

        if (!tast) {
            return res.status(400).send();
        }

        res.send(task)
        
    } catch (error) {
        res.status(500).send(error);
    }

});



module.exports = router