const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer');
const storage = multer.memoryStorage(); // uloží binárne dáta do pamäte
const upload = multer({ storage: storage });
const authenticateToken = require('./auth'); // import middleware
const app = express()
const db = require('./queries')
const port = 3000
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
  res.status(200).send('Token is valid');//
});


//V Appke pridat posielanie headeru spolu s requestom
app.get('/flashcard-sets', authenticateToken, db.getFlashcardsSets);//
app.post('/flashcard-sets', authenticateToken, db.createFlashcardSet);//
app.get('/flashcard-sets/:set_id', authenticateToken, db.getSingleFlashcardSet);//
app.get('/flashcard/:flashcard_id', authenticateToken, db.getFlashcardById);


//CustomMadeFunctions
app.post('/register', db.registerUser);//
app.post('/login', db.loginUser);//
app.get('/statistics', authenticateToken, db.getUserStatistics);//
app.post('/guest-login', db.guestLogin);//

//4.4.2024
app.delete('/flashcard-sets/:set_id', authenticateToken, db.deleteFlashcardSet);//
app.put('/flashcard-sets/:set_id', authenticateToken, db.updateFlashcardSet);//
app.get('/flashcards/:set_id', authenticateToken, db.getFlashcardsBySet);//
app.post('/flashcards',authenticateToken,
  upload.fields([
    { name: 'image_front', maxCount: 1 },
    { name: 'image_back', maxCount: 1 },
  ]),
  db.createFlashcard);//
app.delete('/flashcards/:flashcard_id',authenticateToken,db.deleteFlashcard)//
app.put('/flashcards/:flashcard_id',authenticateToken,
  upload.fields([
    { name: 'image_front', maxCount: 1 },
    { name: 'image_back', maxCount: 1 },
  ]),
  db.updateFlashcard);//
app.put('/statistics', authenticateToken, db.updateStatistics);//
app.post('/statistics/reset', authenticateToken, db.resetStatistics);//
app.post('/notification-token', authenticateToken, db.saveNotificationToken);//
app.get('/preferences', authenticateToken, db.getUserPreferences);//
app.post('/preferences', authenticateToken, db.updateUserPreferences);//
app.get('/public-sets', db.getPublicSets);//
app.get('/public-flashcards/:set_id', db.getPublicFlashcardsBySet);//
app.post('/public-sets', authenticateToken, db.createPublicSet);//
app.post('/public-flashcards', authenticateToken, upload.fields([
  { name: 'image_front', maxCount: 1 },
  { name: 'image_back', maxCount: 1 }
]), db.createPublicFlashcard);//
app.delete('/public-sets/:set_id', authenticateToken, db.deletePublicSet);//
app.delete('/public-flashcards/:flashcard_id', authenticateToken, db.deletePublicFlashcard);//

app.get('/me', authenticateToken, db.getCurrentUser);//



//DOKUMENTACIA API
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'StudyBro API',
      version: '1.0.0',
      description: 'Dokumentácia REST API pre aplikáciu StudyBro',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Lokálny vývojový server',
      },
    ],
  },
  apis: ['./queries.js','./auth.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

//Pocuvanie na porte
app.listen(port, () => {
    console.log(`App running on port ${port}.`)
  })


  