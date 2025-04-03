const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'tajny_kluc'; // ideálne z .env súboru


const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'api',
  password: 'abc',
  port: 5432,
})

//REGISTRACIA
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user_role = 'user';

  try {
    const result = await pool.query(
      `INSERT INTO Users (name, email, password, user_role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id`,
      [name, email, hashedPassword, user_role]
    );

    res.status(201).send(`User registered with ID: ${result.rows[0].user_id}`);
  } catch (error) {
    console.error('User registration failed>', error);
    res.status(500).send('User registration failed');
  }
};


//LOGIN 
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM Users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.user_id, email: user.email }, SECRET_KEY, {
      expiresIn: '1h',
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Login error');
  }
};


//STATISTIKY
const getUserStatistics = (req, res) => {
  const userId = req.user.userId; // z tokenu 

  const query = `
    SELECT avg_accuracy, total_learning_time, best_learning_streak, current_learning_streak
    FROM Users
    WHERE user_id = $1
  `;

  pool.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching user statistics:', error);
      return res.status(500).send('Database error');
    }

    if (results.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(results.rows[0]);
  });
};



//VYTVARANIE SETU
const createFlashcardSet = (request, response) => {
  const { name, is_public_FYN } = request.body;
  const userId = request.user.userId;

  if (!name) {
    return response.status(400).send("Missing flashcard set name.");
  }

  // Najskôr overíme, či už taký set existuje pre tohto používateľa
  pool.query(
    'SELECT * FROM Flashcard_Set WHERE user_id = $1 AND name = $2',
    [userId, name],
    (checkError, checkResults) => {
      if (checkError) {
        console.error(checkError);
        return response.status(500).send("Error checking for existing set.");
      }

      if (checkResults.rows.length > 0) {
        return response.status(409).send("Flashcard set with this name already exists.");
      }

      // Ak neexistuje, pokračujeme s INSERT
      pool.query(
        'INSERT INTO Flashcard_Set (user_id, name, is_public_FYN) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, is_public_FYN ?? false],
        (error, results) => {
          if (error) {
            console.error(error);
            return response.status(500).send("Failed to create flashcard set.");
          }

          response.status(201).json({
            message: "Flashcard set created successfully.",
            set: results.rows[0],
          });
        }
      );
    }
  );
};


//ZISKANIE SETU
const getFlashcardsSets = (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT *
    FROM Flashcard_set fs
    WHERE fs.user_id = $1
    ORDER BY fs.set_id ASC
  `;

  pool.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error fetching flashcards:', error);
      return res.status(500).send('Database error');
    }
    res.status(200).json(results.rows);
  });
};




module.exports = {
  registerUser,
  getFlashcardsSets,
  createFlashcardSet,
  getUserStatistics,
  loginUser

}