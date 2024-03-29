"use strict";

const Router = require("express").Router;
const router = new Router();

const User = require("../models/user");
const Message = require("../models/message");
const { ensureLoggedIn,
        ensureCorrectUser,
        authenticateJWT } = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id",
       ensureLoggedIn,
       async function(req, res, next) {

  const id = req.params.id;

  const message = await Message.get(id);

  if (message.from_user.username !== res.locals.user.username &&
      message.to_user.username !== res.locals.user.username) {
        throw new UnauthorizedError(
          "Invalid credentials: must be sender or recipient to view message."
        );
      }

  return res.json({ message: message });
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/",
       ensureLoggedIn,
       async function(req, res, next) {

  const message = await Message.create({
    from_username : res.locals.user.username,
    to_username : req.body.to_username,
    body: req.body.body
  });
  return res.json({ message: message })
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read",
       ensureLoggedIn,
       async function(req, res, next) {

  const id = req.params.id;
  const message = await Message.get(id);

  if (message.to_user.username !== res.locals.user.username) {
      throw new UnauthorizedError(
        "Invalid credentials: must be recipient to mark message as read."
      );
    }
  const readMessage = await Message.markRead(id);

  return res.json({ message: readMessage })
});


module.exports = router;