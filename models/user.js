"use strict";

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

const { NotFoundError } = require("../expressError");
const db = require("../db");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {

    const hashedPassword = await bcrypt.hash(
      password, BCRYPT_WORK_FACTOR
    );

    const result = await db.query(
      `INSERT INTO users (username,
                              password,
                              first_name,
                              last_name,
                              phone,
                              join_at)
             VALUES
              ($1, $2, $3, $4, $5, current_timestamp)
             RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
            FROM users
            WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    const isUserValid = await bcrypt.compare(password, user.password);

    return isUserValid;
  }
  // bug: before checking the passwords we need to make sure that we got a result
  // for the user (we need to check if user exists, add another clause on line 50
  // if user and bcrypt compare)

  // be more explicit that bcrypt compare gives back boolean true

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
            SET last_login_at = current_timestamp
              WHERE username = $1
              RETURNING username, last_login_at`,
      [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name
         FROM users`
    );

    return result.rows;
  }
  // in general, whenever we're returning ALL of something it's nice to return
  // it with ORDER BY so there's some organization

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
         FROM users
         WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
              m.to_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
              JOIN users AS u ON m.to_username = u.username
        WHERE from_username = $1`,
      [username]
    );

    return result.rows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              m.body,
              m.sent_at,
              m.read_at,
              u.first_name,
              u.last_name,
              u.phone
        FROM messages AS m
              JOIN users AS u ON m.from_username = u.username
        WHERE to_username = $1`,
      [username]
    );

    return result.rows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }
}


module.exports = User;


// Possible update: feature that says whether a user has
// 0 messages either sent/received (depending on what they're trying to find)