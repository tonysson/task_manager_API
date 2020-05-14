const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/users');
 
// on génere un nouvel id
const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id : userOneId,
    name: 'Teyi',
    email: 'teyi@gmail.com',
    password: 'testing04',
    tokens :[{
        token:jwt.sign({_id:userOneId}, process.env.JWT_SECRET)
    }]

}

// Nous permet d'éffacer la bdd a chaque fois qu'on relance un test sinn ca fail
beforeEach( async () => {
    await User.deleteMany();
    await new User(userOne).save();
});

test('Should signup a new user', async () => {

  const response = await request(app).post('/users').send({
        name: 'ae',
        email: 'ae@gmail.com',
        password: 'aesibigan'
    }).expect(201)

    //Nous confirme que la base de donnée a été changé avec succes
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

   //Confirmation sur la response
   expect(response.body).toMatchObject({
      user:{
           name: 'ae',
           email: 'ae@gmail.com',
      },
      token: user.tokens[0].token
   });

   // Confirmation que le password stockée en bdd n'est pas en dur
    expect(user.password).not.toBe('aesibigan');
    
})


test('should login a user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password:  userOne.password
    }).expect(200)
});

test('should not login nonexsitence user', async() => {
    await  request(app).post('/users/login').send({
        email: userOne.email,
        password: 'thisisnotmypassword'
    }).expect(400)
});

test('should get profile for user', async() => {
    await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send().expect(200)
});



test('should not get a profil for unauthenticated user', async()=> {
    await request(app)
    .get('/users/me')
    .send().expect(401)
});


test('should delete a user profile', async() => {
    await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send().expect(200)
});



test('should not delete a profil for unauthenticated user', async () => {
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
});


test('should upload an avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

        const user = await User.findById(userOneId);
        expect(user.avatar).toEqual(expect.any(Buffer));
});

test('should update valid user fields', async() => {
    await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({name: 'kossi'})
    .expect(200)
    
    const user = await User.findById(userOneId);
    expect(user.name).toEqual('kossi');
});












