"use strict";

const Router = require("express").Router;
const router = new Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user")

const { UnauthorizedError, BadRequestError } = require("../expressError");
const db = require("../db");
const { authenticateJWT, ensureLoggedIn } = require("../middleware/auth");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function(req, res, next) {

  if (req.body === undefined) throw new BadRequestError();

  // Register new user
  const newUserInfo = await User.register(req.body);

  // Get token for newly registered user
  const token = jwt.sign({ newUserInfo }, SECRET_KEY);

  // Send newUserInfo to login route, which returns token
  next({ token });
  // notes: await? next? what is the best method

});



/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next){

  console.log('princess tiana is logged in!');

  if (req.body === undefined) throw new BadRequestError();

  const { username, password } = req.body;

  if (await User.authenticate(username, password)){
    const token = jwt.sign({ username }, SECRET_KEY);

    // Update most recent time logged in to current_timestamp
    await User.updateLoginTimestamp(username);

    return res.json({ token });
  } else {
    throw new UnauthorizedError("Invalid username/password");
  }
});





module.exports = router;