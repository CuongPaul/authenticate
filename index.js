import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import Sequelize from 'sequelize';
import bodyParser from 'body-parser';
import { Strategy, ExtractJwt } from 'passport-jwt';

const app = express();

const jwtOptions = {
    secretOrKey: 'secret_key',
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};
const strategy = new Strategy(jwtOptions, async (jwt_payload, done) => {
    const user = await User.findOne({
        where: { id: jwt_payload.id },
    });

    if (user) {
        done(null, user);
    } else {
        done(null, false);
    }
});
passport.use(strategy);

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(bodyParser.urlencoded({ extended: true }));

const sequelize = new Sequelize({
    username: 'root',
    dialect: 'mysql',
    host: '127.0.0.1',
    password: 'Dev1234567@#',
    database: 'test_sequelize',
});
sequelize
    .authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch((err) => console.error('Unable to connect to the database: ', err));

const User = sequelize.define('user', {
    name: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
});
User.sync()
    .then(() => console.log('User table created successfully'))
    .catch((err) => console.log('Oooh, did you enter wrong database credentials?'));

app.get('/', (req, res) => {
    res.json({ message: 'Express is up!' });
});
app.get('/users', async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});
app.post('/register', async (req, res, next) => {
    const { name, password } = req.body;
    const user = await User.create({ name, password });
    res.json({ user, message: 'Account created successfully' });
});
app.post('/login', async (req, res, next) => {
    const { name, password } = req.body;
    if (name && password) {
        const user = await User.findOne({ where: { name } });
        if (!user) {
            res.status(401).json({ message: 'No such user found' });
        } else {
            if (user.password === password) {
                const payload = { id: user.id };
                const token = jwt.sign(payload, jwtOptions.secretOrKey);
                res.json({ message: 'Ok', token: token });
            } else {
                res.status(401).json({ msg: 'Password is incorrect' });
            }
        }
    }
});
app.get('/protected', passport.authenticate('jwt', { session: false }), function (req, res) {
    res.json('Success! You can now see this without a token.');
});

app.listen(3001, function () {
    console.log('Express is running on port 3001');
});
