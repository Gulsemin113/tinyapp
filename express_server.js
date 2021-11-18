const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {urlDatabase,users,randomString, urlsForUser,getUserByEmail} = require('./helpers/helpers');


app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
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


//If you're logged in, it'll show you the urls you've created.
app.get('/urls', (req,res) => {
  const templateVars = {
    user: users[req.session['user_id']],
    urls: urlsForUser(req.session['user_id'],urlDatabase),
    err: req.session['user_id'] ? '' : 'Use your username and password to log in.'
  };
  res.render('urls_index',templateVars);
});


//It checks to determine if the user is logged in before showing the page...
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

/*
If you are signed in, you will be redirected to the /urls page; 
if you are not, you will be sent to the register page..
*/
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


/*
The route delivers the templateVars object
 values to the page when it is rendered.
*/
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



// The URL is redirected to a longer URL..
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(404);
    res.send('<p>Invalid URL </p>');
  }
});

/*
If you're logged in, you'll be taken to the /urls page; if you're not, 
you'll be taken to the /login page..
*/
app.get('/login', (req,res) => {
  if (req.session['user_id']) {
    res.redirect('/urls');
  } else {
    const templateVars = { user : users[req.session['user_id']],err : '' };
    res.render('login', templateVars);
  }
});

/*
The route redirects to the short URL 
after a new URL is added to the database..
*/
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

// The URL gets erased if it belongs to the user..
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


// The urls/shorturl parameter redirects to the urls/shorturl parameter.
app.post('/urls/:shortURL/edit', (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});


// The database's longURL is updated to request the body's url..
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


/*
If correct credentials are entered, 
the user is forwarded to the /urls page;
 otherwise, the user is redirected to the /login page.
*/
app.post('/login', (req,res) => {
  let user = getUserByEmail(req.body.email,users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    const templateVars = {
      user: users[req.session['user_id']],
      err: 'Password or email address are incorrect.'
    };
    res.render('login', templateVars);
  } else {
    req.session['user_id'] = user.id;
    res.redirect('/urls');
  }
});

// Removes all cookies and redirects you to the /urls page..
app.post('/logout', (req,res) => {
  req.session = null;
  res.redirect('/urls');
});


/*
If true credentials are used to create the account, 
the route will redirect to the /urls page. 
If not, a 400 status code is returned and the user is redirected to the /register page.
*/
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
      err: 'Please fill in the blanks below with the right credentials'
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});