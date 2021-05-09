const { User } = require('../models');
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
const getUsers = async (id) => {
    const users = await User.find({}).select('-password');
    return users;
}

const getUserById = async (id) => {
    const user = await User.findById(id).select('-password');
    if (user) {
        return user;
    }
    throw new Error('user not found');
}

const getUserByOpts = async (opts) => {
    const user = await User.findOne(opts).select('-password');
    if (user) {
        return user;
    }
    throw new Error('user not found');
}

const registerUser = async (userData) => {
    const user = await User.findOne({ email: userData.email });
    if (user) {
        throw new Error('email already exists');
    }

    const salt = await bcrypt.genSalt();
    userData.password = await bcrypt.hash(userData.password, salt);

    const newUser = await User.create(userData);
    newUser.password = undefined;

const auth = {
  auth: {
    api_key: "792fd57d35462196161a26b14bb12139-4b1aa784-2586715d",
    domain: "rayyan.com.ng",
  },
};
const nodemailerMailgun = nodemailer.createTransport(mg(auth));

nodemailerMailgun.sendMail(
  {
    from: "Rayyan from Heaven <hello@rayyan.com.ng>",
    to: newUser.email,
    subject: "Marhaba from Rayyan",
    text: "Asalam Alaykum, From Rayyan",
  },
  (err, info) => {
    if (err) {
        console.log(err);
    } else {
      console.log("Email: " + info.email);
    }
  }
);
    return newUser;
}

const updateUserById = async (id, userData) => {
    if (userData.password) {
        const salt = await bcrypt.genSalt();
        userData.password = await bcrypt.hash(userData.password, salt);
    }
    if (userData.email && (await User.isEmailTaken(userData.email, id))) {
        throw new Error('email is already taken');
    }
    const user = await User.findByIdAndUpdate(id, userData);
    if (user) {
        return user;
    }
    throw new Error('user not found');
}

const deleteUserById = async (id) => {
    const user = await User.findById(id);
    if (user) {
        await user.remove();
        return user;
    }
    throw new Error('user not found');
}

const loginWithEmailAndPassword = async (email, password) => {
    const user = await User.findOne({ email });
    if (user) {
        const auth = user.password ? await bcrypt.compare(password, user.password) : null;
        if (auth) {
            user.password = undefined;
            return user;
        }
        throw new Error('incorrect password');
    }
    throw new Error('email not registered');
}

const registerWithThirdParty = async (userData) => {
    const user = await User.findOne({ email: userData.email }).select('-password');
    if (user) {
        return user;
    }
    const newUser = await User.create(userData);
    return newUser;
}

module.exports = {
    getUsers,
    getUserById,
    getUserByOpts,
    registerUser,
    loginWithEmailAndPassword,
    registerWithThirdParty,
    updateUserById,
    deleteUserById,
}