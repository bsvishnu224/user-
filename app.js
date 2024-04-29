const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

dbpath = path.join(__dirname, 'userData.db')

const app = express()

app.use(express.json())

let db = null

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}

initilizeDbAndServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const idUsernameExist = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(idUsernameExist)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUser = `
            INSERT INTO
                user (username,name,password,gender,location)
            VALUES
                ('${username}',
                '${name}',
                '${hashedpassword}',
                '${gender}',
                '${location}'
                
                );
            
            `
      const dbresponse = await db.run(createUser)
      const newUserId = dbresponse.lastId
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const idUsernameExist = ` SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(idUsernameExist)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const inPasswordCorret = await bcrypt.compare(password, dbUser.password)
    if (inPasswordCorret) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getuser = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(getuser)
  const checkOldPassword = await bcrypt.compare(oldPassword, dbUser.password)
  if (checkOldPassword) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const encryptPassword = await bcrypt.hash(newPassword, 10)
      const updatePassword = `
      UPDATE user
      SET
        password="${encryptPassword}"
      WHERE
        username="${dbUser.username}";


      `
      await db.run(updatePassword)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
