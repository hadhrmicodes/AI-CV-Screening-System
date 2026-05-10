/*
 * Module: Backend Database Layer
 * Purpose: Creates the MySQL connection and initializes the database tables
 * used by the AI CV Screening System backend.
 */

// ===========================
// IMPORTS
// ===========================

const mysql = require('mysql');


// ===========================
// DATABASE CONNECTION
// ===========================

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'samar9922',
  database: 'cv_system',
});


// ===========================
// DATABASE INITIALIZATION
// ===========================

const createTableQueries = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('applicant', 'hr', 'admin') NOT NULL,
    contact VARCHAR(255),
    company VARCHAR(255)
  )`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    skills LONGTEXT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'applied',
    shortlisted BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`,
  `CREATE TABLE IF NOT EXISTS cv_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    user_id INT,
    cv_text LONGTEXT,
    file_path VARCHAR(255),
    original_filename VARCHAR(255),
    skills_extracted TEXT,
    education TEXT,
    experience TEXT,
    is_profile_cv BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    score FLOAT NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  )`,
  `CREATE TABLE IF NOT EXISTS saved_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`,
];

const schemaUpdateQueries = [
  'ALTER TABLE cv_data ADD COLUMN file_path VARCHAR(255)',
  'ALTER TABLE cv_data ADD COLUMN original_filename VARCHAR(255)',
  'ALTER TABLE cv_data ADD COLUMN user_id INT',
  'ALTER TABLE cv_data ADD COLUMN is_profile_cv BOOLEAN DEFAULT FALSE',
  'ALTER TABLE cv_data MODIFY COLUMN application_id INT NULL',
  'ALTER TABLE cv_data MODIFY COLUMN user_id INT NULL',
];

db.connect((connectionError) => {
  if (connectionError) {
    throw connectionError;
  }

  console.log('MySQL connected');

  // Create required tables during startup so the app can run on a fresh database.
  createTableQueries.forEach((query) => {
    db.query(query, (tableError) => {
      if (tableError) {
        console.log('Error creating table:', tableError.message);
      }
    });
  });

  // Add newer columns for older databases that were created before file metadata was stored.
  schemaUpdateQueries.forEach((query) => {
    db.query(query, (schemaError) => {
      if (schemaError && !schemaError.message.includes('Duplicate column name')) {
        console.log('Error updating schema:', schemaError.message);
      }
    });
  });
});

module.exports = db;
