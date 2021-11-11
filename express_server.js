const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const randomString = () => {
  let random = Math.random().toString(36).substring(2,8);
  return random;
};

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Create a users Object
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  console.log(req.cookies);
  let varTemplate = {
    username: users[req.cookies['user_id']],
    urls : urlDatabase
  };
  res.render('urls_index.ejs',varTemplate);
});


app.get("/urls/new", (req, res) => {
  let varTemplate = {
    username: users[req.cookies['user_id']]
  };
  res.render("urls_new", varTemplate);
});


app.get('/urls/:shortURL', (req,res) => {
  let templateVars = {
    username: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get('/urls/:shortURL', (req,res) => {
  console.log(req.cookies);
  let varTemplate = {
    username: users[req.cookies['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.param.shortURL]

  };
  res.render("urls_show", varTemplate);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post('/urls', (req,res) => {
  console.log(req.body);
  const shortURL = randomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//The Login Route
app.post('/login', (req,res) => {
  let varTemplate = {
    username: users[req.cookies['user_id']]
  };
  res.render("login", varTemplate);
  
});


//The Logout Route
app.post('/logout', (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

//The Registration Page Route
app.get('/register', (req,res) => {
  let varTemplate = {username: users[req.cookies['user_id']]};
  res.render('registrationPage', varTemplate);
});

//Create a POST /register endpoint
app.post('/register', (req, res) => {
  if(req.body.email === '' || req.body.password === '' || isEmailRegistered(req.body.email)) {
    res.status(400);
    res.redirect('/register');
  } else {
  let userId = randomString();
  users[userId] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', userID);
  res.redirect('/urls');
}
});

//Create a GET /login endpoint
app.get('/login', (req,res) => {
  let varTemplate = {username: users[req.cookies['user_id']]};
  res.render('login', varTemplate);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});