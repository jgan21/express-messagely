"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");

const User = require("../models/user")

const { UnauthorizedError, BadRequestError } = require("../expressError");
const { SECRET_KEY } = require("../config");

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

  // Update most recent time logged in to current_timestamp
  await User.updateLoginTimestamp(username);

  // Send newUserInfo to login route, which returns token
  return res.json({ token });

});

module.exports = router;