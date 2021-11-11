const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const {urlDatabase,users,randomString,isEmailRegistered, urlsForUser} = require('./methods');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (!req.cookies['user_id']) {
    res.redirect('/login');
  } else {
    let templateVars = {
      username : users[req.cookies['user_id']],
      urls :urlsForUser(req.cookies['user_id'])
    };
    res.render("urls_index", templateVars);
  }
  
});


app.get("/urls/new", (req, res) => {
  if (!req.cookies['user_id']) {
    res.redirect('/login');
  } else {
    let templateVars = {
      username: users[req.cookies['user_id']]
    };
    res.render("urls_new", templateVars);
  }
});


app.get('/urls/:shortURL', (req,res) => {
  let templateVars = {
    username: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.get('/urls/:shortURL', (req,res) => {
  
  let templateVars = {
    username: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.param.shortURL]

  };
  res.render("urls_show", templateVars);
});

//GET Login route
app.get('/login', (req,res) => {
  let templateVars = { username : users[req.cookies['user_id']] };
  res.render('login', templateVars);
});

//The Logout Route
app.post('/logout', (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  if (urlDatabase[req.params.shortURL].userID === req.cookies['user_id']) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.cookies['user_id']) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  }
  res.redirect('/urls');
});


app.post('/urls', (req,res) => {
  const shortURL = randomString();
  urlDatabase[shortURL] = {
    userID : req.cookies['user_id'],
    longURL: req.body.longURL
  };
  res.redirect(`/urls/${shortURL}`);
});


//The Registration Page Route
app.get('/register', (req,res) => {
  let templateVars = {username: users[req.cookies['user_id']]};
  res.render('registrationPage', templateVars);
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
    res.cookie('user_id', userID);
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
  if (user.password !== req.body.password || !user) {
    res.status(403);
    res.redirect('/login');
  } else {
    res.cookie('user_id',user.id);
    res.redirect('/urls');
  }
  
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});