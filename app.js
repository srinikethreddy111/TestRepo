const express = require('express')
const sqlite = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
let db = null
let dbPath = path.join(__dirname, 'userData.db')

let initializeServerAndDB = async () => {
  try {
    db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started At http://localhost:3000/')
    })
  } catch (e) {
    console.log('Error: ' + e.message())
    process.exit(1)
  }
}
initializeServerAndDB()

//1
app.post('/register', async (req, res) => {
  const getUser = await db.get(
    `SELECT * FROM user WHERE username='${req.body.username}';`,
  )
  if (getUser === undefined) {
    if (req.body.password.length < 5) {
      res.status(400)
      res.send('Password is too short')
    } else {
      const encryptedPasswd = await bcrypt.hash(req.body.password, 15)
      await db.run(`INSERT INTO user(username,name,password,gender,location)
            VALUES('${req.body.username}','${req.body.name}','${encryptedPasswd}','${req.body.gender}','${req.body.location}');`)
      res.send('User created successfully')
    }
  } else {
    res.status(400)
    res.send('User already exists')
  }
})

//2
app.post('/login', async (req, res) => {
  const getUser = await db.get(
    `SELECT * FROM user WHERE username='${req.body.username}';`,
  )
  if (getUser === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    let isCorrectPasswd = await bcrypt.compare(
      req.body.password,
      getUser.password,
    )
    if (isCorrectPasswd) {
      res.send('Login success!')
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

//3
app.put('/change-password', async (req, res) => {
  let isCorrectPasswd = await bcrypt.compare(
    req.body.oldPassword,
    getUser.password,
  )
  if (isCorrectPasswd) {
    if (req.body.newPassword.length < 5) {
      res.status(400)
      res.send('Password is too short')
    } else {
      let newPassword = await bcrypt.hash(req.body.newPassword, 15)
      await db.run(
        `UPDATE user SET password='${newPassword}' WHERE username='${req.body.username}'`,
      )
      res.send('Password updated')
    }
  } else {
    res.status(400)
    res.send('Invalid current password')
  }
})

module.exports = app
