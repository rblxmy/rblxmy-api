const nbx = require("noblox.js")
const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost/";
const { apiKey, ROBLOSECURITY } = require('./config');

console.log(ROBLOSECURITY)

const dbPort = 6060
let limit = 5000

const mysGID = 1143446

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const router = express.Router();

// Functions

async function IsUserInMYS(userId) {
  let userRankInMYS = await nbx.getRankInGroup(mysGID, userId)
  if (userRankInMYS > 0) {
    return userRankInMYS
  }
  console.log("UserId: " + userId + " is not in MYS")
  return false
}

async function filterUserIdArrayforPayout(userIdArray) {
  let filteredUserIdArray = []
  {
    let i;
    for (i = 0; i < userIdArray.length; i++) {
      let userId = userIdArray[i]
      let userRankInMYS = await IsUserInMYS(userId)
      if (userRankInMYS) {
        filteredUserIdArray.push(userId)
      }
    }
  }
  return filteredUserIdArray
}

async function payoutArray(userArray, amountArray, gid) {
  {
    let i;
    for (i = 0; i < userArray.length; i++) {
      let userId = userArray[i]
      let amount = amountArray[i]
      if (gid) {
        nbx.groupPayout(gid, userId, amount)
      } else {
        nbx.groupPayout(mysGID, userId, amount)
      }
      console.log("UserId: " + userId + " has been paid R$" + amount)
    }
  }
}

async function payoutUser(userVar, amount) {
  const datatype = typeof userVar
  let userId
  if (datatype == 'number') {
    userId = userVar
  } else if (datatype == 'string') {
    userId = await nbx.getIdFromUsername(userVar)
  }
  if (userId) {
    if (amount > 0 && amount < 100) {
      handlePayoutRequest(mysGID, [userId], amount, userId)
    }
  }
}

async function handlePayoutRequest(groupId, userArray, amount, requester, gid) {
  console.log(userArray)
  let payoutUserArray = await filterUserIdArrayforPayout(userArray)
  console.log(payoutUserArray)
  let totalToPay = payoutUserArray.length * amount

  if (totalToPay < limit) {
    limit = limit - totalToPay
    let amountArray = []
    {
      let i;
      for (i = 0; i < payoutUserArray.length; i++) {
        amountArray.push(amount);
      }
    }
    console.log(amountArray)
    console.log(totalToPay + " has been subtracted from the total limit. New limit: " + limit)
    await payoutArray(payoutUserArray, amountArray, gid)
    console.log("GroupID of request: " + groupId + ". Requester " + requester + " has paid " + payoutUserArray.length + " users R$" + amount + " each , a total of R$" + totalToPay)
  } else {
    console.log("Insufficient limit")
  }
}

async function payoutMAW(amount) {
  let pdrmGroupRoles = await nbx.getRoles(5000479)
  let pdrmRoleSets = []
  {
    let i;
    for (i = 0; i < pdrmGroupRoles.length; i++) {
      pdrmRoleSets.push(pdrmGroupRoles[i].ID);
    }
  }
  let pdrmMembers = await nbx.getPlayers(5000479, pdrmRoleSets)
  console.log(pdrmMembers)
  console.log(pdrmMembers.length)
  let payoutUserArray = []
  {
    let i;
    for (i = 0; i < pdrmMembers.length; i++) {
      payoutUserArray.push(pdrmMembers[i].userId);
    }
  }
  console.log(payoutUserArray)
  handlePayoutRequest(5000479, payoutUserArray, amount, "Graviitron", 5000479)
}

async function payoutPDRM(amount) {
  let pdrmGID = 1182710
  let pdrmGroupRoles = await nbx.getRoles(pdrmGID)
  let pdrmRoleSets = []
  {
    let i;
    for (i = 0; i < pdrmGroupRoles.length; i++) {
      pdrmRoleSets.push(pdrmGroupRoles[i].ID);
    }
  }
  let pdrmMembers = await nbx.getPlayers(pdrmGID, pdrmRoleSets)
  console.log(pdrmMembers)
  console.log(pdrmMembers.length)
  let payoutUserArray = []
  {
    let i;
    for (i = 0; i < pdrmMembers.length; i++) {
      payoutUserArray.push(pdrmMembers[i].userId);
    }
  }
  console.log(payoutUserArray)
  handlePayoutRequest(pdrmGID, payoutUserArray, amount, "yan3321")
}

async function getDBConnection() {
  return new Promise(async (resolve, reject) => {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      resolve(db)
    });
  })
}

async function getDuitRayaLimit() {
  return new Promise(async (resolve, reject) => {
    getDBConnection().then((db) => {
      const dbo = db.db("mydb");
      const collection = dbo.collection("raya")
      const query = { name: 'duitRayaLimit' }
      collection.find(query).toArray(function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          resolve(result[0].duitRayaLimit)
          db.close()
        } else {
          collection.updateOne(
            { name: 'duitRayaLimit' },
            { $set: { name: 'duitRayaLimit', duitRayaLimit: 2000 } },
            { upsert: true }
          )
            .then(() => {
              resolve(2000)
              db.close()
            })
            .catch(() => {
              reject()
              db.close()
            })
        }
      })
    });
  })
}

async function incrementDuitRayaLimit(number) {
  return new Promise(async (resolve, reject) => {
    getDBConnection().then((db) => {
      const dbo = db.db("mydb");
      const collection = dbo.collection("raya")
      const query = { name: 'duitRayaLimit' }
      collection.find(query).toArray(function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          collection.updateOne(
            { name: 'duitRayaLimit' },
            { $inc: { duitRayaLimit: number } },
            { upsert: true }
          )
            .then(() => {
              resolve(true)
              db.close()
            })
        } else {
          collection.updateOne(
            { name: 'duitRayaLimit' },
            { $set: { name: 'duitRayaLimit', duitRayaLimit: 2000 } },
            { upsert: true }
          )
            .then(() => {
              collection.updateOne(
                { name: 'duitRayaLimit' },
                { $inc: { duitRayaLimit: number } },
                { upsert: true }
              )
                .then(() => {
                  resolve(true)
                  db.close()
                })
            })
        }
      })
    });
  })
}

async function payoutDuitRaya(playerVar) {
  return new Promise((resolve, reject) => {
    getDuitRayaLimit()
      .then((result) => {
        const amountToGive = 10
        const limit = result
        if (amountToGive < limit) {
          payoutUser(playerVar, amountToGive)
          incrementDuitRayaLimit(-10)
            .then(() => {
              getDuitRayaLimit()
                .then((remaining) => {
                  console.log(remaining)
                  resolve(remaining)
                })
            })
        } else {
          reject()
        }
      })
  })
}

// Setting up the express server

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(dbPort, function () {
  console.log('Example app listening on port ' + dbPort.toString() + '!');
});

router.use(function (req, res, next) {
  console.log('Router accessed');
  next();
});

router.get('/', function (req, res) {
  res.json({ message: 'Welcome to the rblxmy-api!' });
});

router.route('/duitraya')
  .get(function (req, res) {
    const providedKey = req.query.key
    console.log(providedKey)
    if (providedKey) {
      if (providedKey == apiKey) {
        payoutDuitRaya(playerVar)
        res.json({ status: 'success' })
      } else {
        res.status(400).send('Invalid key!')
      }
    } else {
      res.status(400).send('No key!')
    }
  })
  .post(function (req, res) {
    const providedKey = req.query.key
    if (providedKey) {
      if (providedKey == apiKey) {
        const payoutUserId = Number(req.body.userid)
        console.log(payoutUserId)
        if (payoutUserId) {
          payoutDuitRaya(payoutUserId)
            .then((remaining) => {
              console.log(remaining)
              res.json({ status: 'success', remainingLimit: remaining, message: `UserId ${payoutUserId} has been paid R$10 for duit raya ` })
            })
        }
      } else {
        res.status(400).send('Invalid key!')
      }
    } else {
      res.status(400).send('No key!')
    }
  });

app.use('/api', router);

// Start the application

async function startApp() {
  let a = 'sadfa'
  console.log(`ok ${a}`)
  await nbx.cookieLogin(ROBLOSECURITY)
  let currentUser = await nbx.getCurrentUser()
  console.log(`Logged in with ${currentUser.UserName}`)
  // payoutMAW(5)
}

startApp()