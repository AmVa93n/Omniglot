const express = require("express");
const router = express.Router();
const formatDate = require("../utils/date");

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require("../models/User.model");

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require("../middleware/isLoggedOut");
const isLoggedIn = require("../middleware/isLoggedIn");

// ℹ️ Handles file upload via forms
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads'); // Directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, 'pfp-' + Date.now() + path.extname(file.originalname)); // File naming convention
  }
});

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB (adjust as needed)
});

// GET /auth/signup
router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

// POST /auth/signup
router.post("/signup", upload.single('profilepic'), isLoggedOut, (req, res) => {
  console.log(req.body)
  const { username, email, password, gender, birthdate, country, lang_speak, lang_learn, private} = req.body;
  const formattedDate = birthdate ? formatDate(new Date(birthdate)) : null
  const profilePic = req.file ? req.file.filename : null;
  const isPrivateProfile = !!private

  // Check that username, email, and password are provided
  if ([username,email,password].some(field => field === "")) {
    res.status(400).render("auth/signup", {
      errorMessage:
        "Some mandatory fields are missing. Please provide your username, email and password.",
    });
    return;
  }

  if (!lang_learn || lang_learn.length === 0) {
    res.status(400).render("auth/signup", {
      errorMessage:
        "Please choose at least one language you'd like to learn",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).render("auth/signup", {
      errorMessage: "Your password needs to be at least 8 characters long.",
    });

    return;
  }

  //   ! This regular expression checks password for special characters and minimum length
  
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;
  if (!regex.test(password)) {
    res
      .status(400)
      .render("auth/signup", {
        errorMessage: "Password needs to have at least 8 characters and must contain at least one number, one lowercase and one uppercase letter."
    });
    return;
  }

  // Create a new user - start by hashing the password
  bcrypt
    .genSalt(saltRounds)
    .then((salt) => bcrypt.hash(password, salt))
    .then((hashedPassword) => {
      // Create a user and save it in the database
      return User.create({ username, email, password: hashedPassword, gender, birthdate: formattedDate, country, 
        profilePic, lang_speak, lang_learn, private: isPrivateProfile });
    })
    .then((user) => {
      res.redirect("/auth/login");
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("auth/signup", { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render("auth/signup", {
          errorMessage:
            "The username or the email address is already taken. Choose a different username or email.",
        });
      } else {
        next(error);
      }
    });
});

// GET /auth/login
router.get("/login", isLoggedOut, (req, res) => {
  res.render("auth/login");
});

// POST /auth/login
router.post("/login", isLoggedOut, (req, res, next) => {
  const { username, password } = req.body;

  // Check that username, email, and password are provided
  if (username === "" || password === "") {
    res.status(400).render("auth/login", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });

    return;
  }

  // Search the database for a user with the email submitted in the form
  User.findOne({ username })
    .then((user) => {
      // If the user isn't found, send an error message that user provided wrong credentials
      if (!user) {
        res
          .status(400)
          .render("auth/login", { errorMessage: "User not found. Please try again." });
        return;
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt
        .compare(password, user.password)
        .then((isSamePassword) => {
          if (!isSamePassword) {
            res
              .status(400)
              .render("auth/login", { errorMessage: "Password is incorrect. Please try again." });
            return;
          }

          // Add the user object to the session object
          req.session.currentUser = user.toObject();
          // Remove the password field
          delete req.session.currentUser.password;

          res.redirect("/");
        })
        .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
    })
    .catch((err) => next(err));
});

// GET /auth/logout
router.get("/logout", isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render("auth/logout", { errorMessage: err.message });
      return;
    }

    res.redirect("/");
  });
});

// GET /profile
router.get("/profile", isLoggedIn, (req, res) => {
  let user = req.session.currentUser
  res.render("auth/profile", {user});
});

// GET /profile/delete
router.get("/profile/delete", isLoggedIn, (req, res) => {
  const user = req.session.currentUser
  const username = user.username
  User.findOneAndDelete({ username })
    .then(() => {
      if (user.profilePic) { // delete profile picture from file system, if it exists
        const profilePicPath = path.join(__dirname, '../public/uploads', user.profilePic);
        fs.unlinkSync(profilePicPath)
      }
      req.session.destroy(() => {
        res.redirect("/");
      })
    })
    .catch((err) => {
      res.status(500).render("auth/profile", { errorMessage: "An error occurred while deleting your account." });
    });
});

// POST route to handle edit username
router.post('/profile/edit/username', isLoggedIn, async (req, res) => {
  const { username } = req.body;
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { username }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update username. Please try again.' });
  }
});

// POST route to handle edit email
router.post('/profile/edit/email', isLoggedIn, async (req, res) => {
  const { email } = req.body;
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { email }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update email. Please try again.' });
  }
});

// POST route to handle edit gender
router.post('/profile/edit/gender', isLoggedIn, async (req, res) => {
  const { gender } = req.body;
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { gender }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update gender. Please try again.' });
  }
});

// POST route to handle edit birthdate
router.post('/profile/edit/birthdate', isLoggedIn, async (req, res) => {
  const { birthdate } = req.body;
  const formattedDate = formatDate(new Date(birthdate))
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { birthdate: formattedDate }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update birthdate. Please try again.' });
  }
});

// POST route to handle edit country
router.post('/profile/edit/country', isLoggedIn, async (req, res) => {
  const { country } = req.body;
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { country }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update country. Please try again.' });
  }
});

// POST route to handle edit language user speaks
router.post('/profile/edit/lang_speak', isLoggedIn, async (req, res) => {
  let { lang_speak } = req.body;
  if (!lang_speak) lang_speak = []
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { lang_speak }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update languages. Please try again.' });
  }
});

// POST route to handle edit language user wants to learn
router.post('/profile/edit/lang_learn', isLoggedIn, async (req, res) => {
  let { lang_learn } = req.body;
  const userId = req.session.currentUser._id;

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, { lang_learn }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update languages. Please try again.' });
  }
});

// POST route to handle edit profile picture
router.post('/profile/edit/pfp', upload.single('edit-pfp'), isLoggedIn, async (req, res) => {
  const profilePic = req.file ? req.file.filename : null;
  const user = req.session.currentUser
  const userId = req.session.currentUser._id;

  try {
    if (user.profilePic) { // delete old profile picture from file system, if it exists
      const oldPfpPath = path.join(__dirname, '../public/uploads', user.profilePic);
      fs.unlinkSync(oldPfpPath)
    } 
    const updatedUser = await User.findByIdAndUpdate(userId, { profilePic }, { new: true });
    req.session.currentUser = updatedUser; // Update current user in session
    res.redirect('/auth/profile'); // Redirect to profile page
  } catch (err) {
    res.status(500).render('auth/profile', { errorMessage: 'Failed to update profile picture. Please try again.' });
  }
});

// GET route matches
router.get("/matches", isLoggedIn, async (req, res) => {
  const user = req.session.currentUser
  const user_speak = user.lang_speak
  const user_learn = user.lang_learn
  const matches = await User.find({lang_speak: { $in: user_learn }, lang_learn: { $in: user_speak }})
  for (let match of matches) { // filter irrelevant languages
    match.lang_speak = match.lang_speak.filter(lang => user_learn.includes(lang))
    match.lang_learn = match.lang_learn.filter(lang => user_speak.includes(lang))
  }
  res.render("auth/matches", {user, matches});
});

module.exports = router;