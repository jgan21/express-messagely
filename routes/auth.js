"use strict";

const Router = require("express").Router;
const router = new Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { UnauthorizedError, BadRequestError } = require("../expressError");
const db = require("../db");
const { authenticateJWT, ensureLoggedIn } = require("../middleware/auth");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");


/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next){
  if (req.body === undefined) throw new BadRequestError();

  const { username, password } = req.body;

  if (await User.authenticate(username, password)){
    const token = jwt.sign({ username }, SECRET_KEY);
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

  // Register new user
  const newUserInfo = await User.register(req.body);

  // Send newUserInfo to login route, which returns token
  return await res.send("/login", newUserInfo);

});


module.exports = router;