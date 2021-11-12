const bcrypt = require('bcrypt');

const urlDatabase = {
  b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
  i3BoGr: { longURL: 'https://www.google.ca', userID: 'aJ48lW' }
};

//Create a users Object
const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password:  bcrypt.hashSync('purple-monkey-dinosaur', 10)
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('dishwasher-funk', 10)
  }
};


// Generates random string.
const randomString = () => {
  let random = Math.random().toString(36).substring(2,8);
  return random;
};



// Checks if there is an email that is same as users email.
const isEmailRegistered = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

/*
If the database user's id match, then the urls for the
user is matched as well.
*/
const urlsForUser = (id) => {
  let userUrls = {};
  for (const shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userID === id) {
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userUrls;

};
/*
Checks whether the email in the database is the same as the user's email
that we are searching for.
*/
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = {urlDatabase,users,randomString,isEmailRegistered,urlsForUser,getUserByEmail};