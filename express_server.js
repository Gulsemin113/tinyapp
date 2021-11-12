var cookieSession = require('cookie-session')
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const {urlDatabase,users,randomString,isEmailRegistered, urlsForUser} =  require('./helpers/helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: [/* secret keys */],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.get('/', (req,res) => {
  if(!req.session['user_id']) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls/new', (req,res) => {
  if (!req.session['user_id']) {
    res.redirect('/login');
  } else {
    let templateVars = {
      username : users[req.session['user_id']]
    };
    res.render("urls_new", templateVars);
  }
  
});


app.get('/urls', (req,res) => {
  if (!req.session['user_id']) {
    res.redirect('/login');
  } else {
    let templateVars = {
      username: users[req.session['user_id']],
      urls :urlsForUser(req.session['user_id'])
    };
    res.render("urls_index", templateVars);
  }
});


app.get('/urls/:shortURL', (req,res) => {
  let templateVars = {
    username: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.get('/urls/:shortURL', (req,res) => {
  
  let templateVars = {
    username: users[req.session['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.param.shortURL]

  };
  res.render("urls_show", templateVars);
});

//GET Login route
app.get('/login', (req,res) => {
  let templateVars = { username : users[req.session['user_id']] };
  res.render('login', templateVars);
});

//The Logout Route
app.post('/logout', (req,res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  if (urlDatabase[req.params.shortURL].userID === req.session['user_id']) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session['user_id']) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});


app.post('/urls', (req,res) => {
  const shortURL = randomString();
  urlDatabase[shortURL] = {
    userID : req.session['user_id'],
    longURL: req.body.longURL
  };
  res.redirect(`/urls/${shortURL}`);
});


//The Registration Page Route
app.get('/register', (req,res) => {
  if(req.session['user_id']) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session['user_id']]
    };
    res.render('registrationPage', templateVars);
  }
  
});

//Create a POST /register endpoint
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '' || isEmailRegistered(req.body.email)) {
    res.status(400);
    res.redirect('/register');
  } else {
    let userID = randomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password,10)
    };
    req.session['user_id'] = userID;
    res.redirect('/urls');
  }
});

//Create a GET /login endpoint
app.get('/login', (req,res) => {
  let templateVars = {username: users[req.cookies['user_id']]};
  res.render('login', templateVars);
});

//The Login Route
app.post('/login', (req,res) => {
  let user = isEmailRegistered(req.body.email);
  if (!bcrypt.compareSync(req.body.password, user.password) || !user) {
    res.status(403);
    res.redirect('/login');
  } else {
    res.cookie('user_id',user.id);
    res.redirect('/urls');
  }
  
});

app.get('/users.json', (req,res) => {
  res.json(users);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});