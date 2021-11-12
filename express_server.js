const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const {urlDatabase,users,randomString, urlsForUser,getUserByEmail} = require('./helpers/helpers');
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

/*If you're logged in, the route will take you to /urls;
if you're not, it'll take you to /login.*/
app.get('/', (req,res) => {
  if (!req.session['user_id']) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

//If you're logged in, you'll see the urls that the user made.
app.get('/urls', (req,res) => {
  const templateVars = {
    user: users[req.session['user_id']],
    urls: urlsForUser(req.session['user_id'],urlDatabase),
    err: req.session['user_id'] ? '' : 'Login with your credentials'
  };
  res.render('urls_index',templateVars);
});

//Before displaying the page, it checks to see if the user is logged in.
app.get('/urls/new', (req,res) => {
  if (!req.session['user_id']) {
    res.redirect('/login');
  } else {
    const templateVars = {
      user: users[req.session['user_id']],
      err: ''
    };
    res.render('urls_new', templateVars);
  }
});


app.get('/urls/:shortURL', (req,res) => {
  const templateVars = {
    user: users[req.session['user_id']],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.param.shortURL],
    err: urlDatabase[req.params.shortURL] ? '' : 'Invalid Link'
  };
  if (!urlDatabase[req.params.shortURL]) {
    templateVars.err = 'Invalid Link.';
  } else if (!req.session['user_id']) {
    templateVars.err = 'User is not logged in';
  } else if (urlDatabase[req.params.shortURL].userID !== req.session['user_id']) {
    templateVars.err = 'User doesnt have the URL';
  }
  res.render('urls_show', templateVars);
});


app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(404);
    res.send('<p>Invalid URL </p>');
  }
});

//GET Login route
app.get('/login', (req,res) => {
  const templateVars = { user : users[req.cookies['user_id']] };
  res.render('login', templateVars);
});

//The Logout Route
app.post('/logout', (req,res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req,res) => {
  if (!req.session['user_id']) {
    res.send('<p>User should login</p>');
  } else if (urlDatabase[req.params.shortURL].userID === req.session['user_id']) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.send('<p>URL does not exist</p>');
  }
});

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post('/urls/:shortURL/update', (req, res) => {
  if (!req.session['user_id']) {
    res.send('<p>User should login</p>');
  } else if (urlDatabase[req.params.shortURL].userID === req.session['user_id']) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send('<p>URL does not exist</p>');
  }
});


app.post('/urls', (req,res) => {
  if (req.session['user_id']) {
    const shortURL = randomString();
    urlDatabase[shortURL] = {
      userID : req.session['user_id'],
      longURL: req.body.longURL
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('<p>User should login</p>');
  }
});


//The Registration Page Route
app.get('/register', (req,res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = {
      user: users[req.session['user_id']],
      err:''
    };
    res.render('register', templateVars);
  }
});


//Create a POST /register endpoint
app.post('/register', (req,res) => {
  if (getUserByEmail(req.body.email,users)) {
    const templateVars = {
      user: users[req.session['user_id']],
      err: 'Email exists'
    };
    res.render('register',templateVars);
  } else if (req.body.email === '' || req.body.password === '') {
    const templateVars = {
      user: users[req.session['user_id']],
      err: 'Please fill in the boxes with valid credentials'
    };
    res.render('register',templateVars);
  } else {
    const userId = randomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password,10)
    };
    req.session['user_id'] = userId;
    res.redirect('/urls');
  }
});

//Create a GET /login endpoint
app.get('/login', (req,res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render('login', templateVars);
});

//The Login Route
app.post('/login', (req,res) => {
  let user = getUserByEmail(req.body.email,users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    const templateVars = {
      user: users[req.session['user_id']],
      err: 'Incorrect password or email address'
    };
    res.render('login', templateVars);
  } else {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});