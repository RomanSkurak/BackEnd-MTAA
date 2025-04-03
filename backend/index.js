const express = require('express')
const bodyParser = require('body-parser')
const authenticateToken = require('./auth'); // import middleware
const app = express()
const db = require('./queries')
const port = 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
    response.json({ info: 'API running' })
  })

// Testovaci chránený endpoint
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is protected data.', user: req.user });
});

app.get('/verify-token', authenticateToken, (req, res) => {
  res.status(200).send('Token is valid');
});


//V Appke pridat posielanie headeru spolu s requestom
app.get('/flashcard-sets', authenticateToken, db.getFlashcardsSets);
app.post('/flashcard-sets', authenticateToken, db.createFlashcardSet);


//CustomMadeFunctions
app.post('/register', db.registerUser);
app.post('/login', db.loginUser);
app.get('/statistics', authenticateToken, db.getUserStatistics);



app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })


  