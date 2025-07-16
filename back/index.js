// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// In-memory cache
let usersCache = [];

// Refresh cache from DB
async function refreshUsersCache() {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
    usersCache = rows;
    console.log('Users cache refreshed');
  } catch (err) {
    console.error('Error refreshing users cache:', err);
  }
}

// Create users table if not exists
async function createUsersTableIfNotExists() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE
    )
  `;
  try {
    await pool.query(createTableQuery);
    console.log('Users table checked/created successfully');
    await refreshUsersCache(); // Prefetch users after table check
  } catch (err) {
    console.error('Error creating users table:', err);
  }
}
createUsersTableIfNotExists();

// Get all users (from cache)
app.get('/users', (req, res) => {
  res.json(usersCache);
});

// Create user
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'Name and Email are required' });

  try {
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );

    await refreshUsersCache(); // Refresh cache after insert
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: 'Name and Email are required' });

  try {
    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1 AND id <> $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered by another user' });
    }

    const { rows } = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    await refreshUsersCache(); // Refresh cache after update
    res.json(rows[0]);
  } catch (err) {
    console.error(`PUT /users/${id} error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0)
      return res.status(404).json({ error: 'User not found' });

    await refreshUsersCache(); // Refresh cache after delete
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(`DELETE /users/${id} error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
