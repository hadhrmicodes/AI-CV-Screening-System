/*
 * Module: Backend API Server
 * Purpose: Hosts the Express APIs for authentication, jobs, applications,
 * profile management, admin actions, CV parsing, and AI score integration.
 * Enhanced with JWT authentication and role-based authorization.
 */

// ===========================
// IMPORTS
// ===========================

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const db = require('./db');


// ===========================
// APPLICATION STATE
// ===========================

const app = express();
const upload = multer({ dest: 'uploads/' });
const uploadsDirectory = path.resolve(__dirname, 'uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// ===========================
// JWT MIDDLEWARE
// ===========================

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).send({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: 'Invalid token' });
  }
}

function verifyRoleHR(req, res, next) {
  if (req.user.role !== 'hr') {
    return res.status(403).send({ message: 'Unauthorized: HR role required' });
  }
  next();
}

function verifyRoleAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).send({ message: 'Unauthorized: Admin role required' });
  }
  next();
}

function queryAsync(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}


// ===========================
// HELPER FUNCTIONS
// ===========================

async function extractText(file) {
  const filePath = file.path;
  const originalFileName = file.originalname || '';
  const mimeType = file.mimetype || '';
  const fileExtension = path.extname(originalFileName).toLowerCase();

  // Parse uploaded PDF CVs and return extracted text for storage and AI scoring.
  if (fileExtension === '.pdf' || mimeType === 'application/pdf') {
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const pdfData = await parser.getText();
      return pdfData.text || '';
    } finally {
      await parser.destroy();
    }
  }

  // Parse uploaded DOCX CVs when applicants use Word documents.
  if (
    fileExtension === '.docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error('Unsupported file type');
}

async function getStoredPasswordValue(password) {
  if (!password) {
    return '';
  }

  // Keep existing bcrypt hashes untouched, but hash legacy plain-text passwords.
  const looksHashed = password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
  return looksHashed ? password : bcrypt.hash(password, 10);
}

async function ensureCvDataProfileSchema() {
  const schemaFixQueries = [
    'ALTER TABLE cv_data ADD COLUMN user_id INT NULL',
    'ALTER TABLE cv_data ADD COLUMN is_profile_cv BOOLEAN DEFAULT FALSE',
    'ALTER TABLE cv_data ADD COLUMN file_path VARCHAR(255)',
    'ALTER TABLE cv_data ADD COLUMN original_filename VARCHAR(255)',
    'ALTER TABLE cv_data MODIFY COLUMN application_id INT NULL',
    'ALTER TABLE cv_data MODIFY COLUMN user_id INT NULL',
  ];

  for (const sql of schemaFixQueries) {
    try {
      await queryAsync(sql);
    } catch (error) {
      const message = error.message || '';
      const ignorable =
        message.includes('Duplicate column name') ||
        message.includes('Data truncated') ||
        message.includes('already exists');

      if (!ignorable) {
        console.log('CV schema fix note:', message);
      }
    }
  }
}

async function saveOrUpdateScore(applicationId, score) {
  const updateResult = await queryAsync(
    'UPDATE scores SET score=? WHERE application_id=?',
    [score, applicationId]
  );

  if (!updateResult.affectedRows) {
    await queryAsync('INSERT INTO scores (application_id, score) VALUES (?, ?)', [applicationId, score]);
  }
}


// ===========================
// AUTH APIs
// ===========================

// POST /login
// Authenticates a user by email and compares the submitted password with bcrypt.
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email=?';

  // Database query: fetch the user record needed for password verification.
  db.query(query, [email], async (error, results) => {
    if (error) {
      return res.send({ message: 'Server error' });
    }

    if (!results.length) {
      return res.send({ message: 'Invalid credentials' });
    }

    const [user] = results;
    let isValidPassword = false;
    const storedPassword = user.password || '';
    const isBcryptHash =
      storedPassword.startsWith('$2a$') ||
      storedPassword.startsWith('$2b$') ||
      storedPassword.startsWith('$2y$');

    if (isBcryptHash) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      // Support legacy plain-text passwords created before bcrypt was introduced.
      isValidPassword = password === storedPassword;

      if (isValidPassword) {
        const upgradedPasswordHash = await bcrypt.hash(password, 10);

        // Database query: transparently upgrade a legacy password to bcrypt after successful login.
        db.query('UPDATE users SET password=? WHERE id=?', [upgradedPasswordHash, user.id], (updateError) => {
          if (updateError) {
            console.log('Legacy password upgrade error:', updateError.message);
          }
        });
      }
    }

    if (!isValidPassword) {
      return res.send({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.send({
      message: 'Login successful',
      name: user.name,
      role: user.role,
      user_id: user.id,
      token: token,
    });
  });
});

// POST /register
// Creates a new user account and hashes the password before inserting it.
app.post('/register', async (req, res) => {
  const { name, email, password, role, contact, company } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, password, role, contact, company)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [name, email, hashedPassword, role, contact, company];

    // Database query: persist the new user profile.
    db.query(query, values, (error, result) => {
      if (error) {
        return res.send({ message: 'Registration failed' });
      }

      // Generate JWT token for new user
      const token = jwt.sign(
        { user_id: result.insertId, role: role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.send({
        message: 'Registration successful',
        user_id: result.insertId,
        name,
        role,
        token: token,
      });
    });
  } catch (error) {
    return res.send({ message: 'Server error' });
  }
});

// GET /user/:id
// Returns the profile fields needed by the frontend profile page.
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT id, name, email, contact, company, role FROM users WHERE id=?';

  // Database query: fetch a single user profile by primary key.
  db.query(query, [userId], (error, results) => {
    if (error || !results.length) {
      return res.send({ message: 'User not found' });
    }

    return res.send(results[0]);
  });
});

// PUT /user/:id
// Updates the current user's profile while preserving the existing route contract.
app.put('/user/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, contact, company, password } = req.body;

  const updateUserProfile = async () => {
    let query = 'UPDATE users SET name=?, email=?, contact=?, company=? WHERE id=?';
    let values = [name, email, contact, company || null, userId];

    if (password) {
      const storedPasswordValue = await getStoredPasswordValue(password);
      query = 'UPDATE users SET name=?, email=?, contact=?, company=?, password=? WHERE id=?';
      values = [name, email, contact, company || null, storedPasswordValue, userId];
    }

    // Database query: update editable profile fields for the current user.
    db.query(query, values, (error) => {
      if (error) {
        return res.send({ message: 'Update failed' });
      }

      return res.send({ message: 'Profile updated' });
    });
  };

  updateUserProfile().catch(() => {
    return res.send({ message: 'Update failed' });
  });
});

// DELETE /user/:id
// Deletes the current user's own account from the system.
app.delete('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id=?';

  // Database query: remove the current user's account.
  db.query(query, [userId], (error) => {
    if (error) {
      return res.send({ message: 'Delete failed' });
    }

    return res.send({ message: 'Account deleted' });
  });
});

// PUT /update-profile/:id
// Allows admins to update another user's profile, role, and optional password.
app.put('/update-profile/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, contact, company, password, role } = req.body;

  const updateAdminManagedProfile = async () => {
    let query = 'UPDATE users SET name=?, email=?, contact=?, company=?, role=? WHERE id=?';
    let values = [name, email, contact, company || null, role, userId];

    if (password) {
      const storedPasswordValue = await getStoredPasswordValue(password);
      query = 'UPDATE users SET name=?, email=?, contact=?, company=?, role=?, password=? WHERE id=?';
      values = [name, email, contact, company || null, role, storedPasswordValue, userId];
    }

    // Database query: admin-level update for user management.
    db.query(query, values, (error) => {
      if (error) {
        return res.send({ message: 'Update failed' });
      }

      return res.send({ message: 'User updated' });
    });
  };

  updateAdminManagedProfile().catch(() => {
    return res.send({ message: 'Update failed' });
  });
});


// ===========================
// JOB APIs
// ===========================

// POST /add-job
// Creates a new job record from the HR job form.
app.post('/add-job', verifyToken, verifyRoleHR, (req, res) => {
  const { title, description, skills } = req.body;
  const query = 'INSERT INTO jobs (title, description, skills) VALUES (?, ?, ?)';

  // Database query: store the new job posting.
  db.query(query, [title, description, skills], (error) => {
    if (error) {
      return res.send({ message: 'Error adding job' });
    }

    return res.send({ message: 'Job added successfully' });
  });
});

// GET /jobs
// Returns all jobs or excludes jobs already applied to by a specific applicant.
app.get('/jobs', (req, res) => {
  const userId = req.query.user_id;
  let query = 'SELECT * FROM jobs';
  let values = [];

  if (userId) {
    query = `
      SELECT *
      FROM jobs
      WHERE status != 'closed'
      AND id NOT IN (SELECT job_id FROM applications WHERE user_id = ?)
    `;
    values = [userId];
  }

  // Database query: list jobs, optionally filtered by existing applications.
  db.query(query, values, (error, results) => {
    if (error) {
      return res.send({ message: 'Error fetching jobs' });
    }

    return res.send(results);
  });
});

// POST /close-job/:id
// Marks a job as closed so applicants can no longer apply to it.
app.post('/close-job/:id', verifyToken, verifyRoleHR, (req, res) => {
  const jobId = req.params.id;
  const query = "UPDATE jobs SET status='closed' WHERE id=?";

  // Database query: update the job status to closed.
  db.query(query, [jobId], (error) => {
    if (error) {
      return res.send({ message: 'Error closing job' });
    }

    return res.send({ message: 'Job closed' });
  });
});

// PUT /update-job/:id
// Updates the editable fields for an existing job posting.
app.put('/update-job/:id', verifyToken, verifyRoleHR, (req, res) => {
  const jobId = req.params.id;
  const { title, description, skills } = req.body;
  const query = 'UPDATE jobs SET title=?, description=?, skills=? WHERE id=?';

  // Database query: save edited job details.
  db.query(query, [title, description, skills, jobId], (error) => {
    if (error) {
      return res.send({ message: 'Error updating job' });
    }

    return res.send({ message: 'Job updated' });
  });
});

// DELETE /delete-job/:id
// Removes a job record from the jobs table.
app.delete('/delete-job/:id', verifyToken, verifyRoleHR, (req, res) => {
  const jobId = req.params.id;
  const query = 'DELETE FROM jobs WHERE id=?';

  // Database query: delete the selected job.
  db.query(query, [jobId], (error) => {
    if (error) {
      return res.send({ message: 'Error deleting job' });
    }

    return res.send({ message: 'Job deleted' });
  });
});


// ===========================
// APPLICATION APIs
// ===========================

// POST /apply
// Creates an application using the applicant's latest uploaded profile CV.
app.post('/apply', async (req, res) => {
  const { user_id: userId, job_id: jobId } = req.body;

  try {
    await ensureCvDataProfileSchema();

    const duplicateResults = await queryAsync(
      'SELECT id FROM applications WHERE user_id=? AND job_id=?',
      [userId, jobId]
    );

    if (duplicateResults.length) {
      return res.send({ message: 'Already applied' });
    }

    const cvResults = await queryAsync(
      `
        SELECT id, cv_text
        FROM cv_data
        WHERE user_id = ? AND is_profile_cv = true
        ORDER BY id DESC
        LIMIT 1
      `,
      [userId]
    );

    if (!cvResults.length) {
      return res.send({ message: 'Please upload a CV first' });
    }

    const [cvData] = cvResults;
    const applicationResult = await queryAsync(
      'INSERT INTO applications (user_id, job_id, status) VALUES (?, ?, ?)',
      [userId, jobId, 'applied']
    );
    const applicationId = applicationResult.insertId;

    const jobResults = await queryAsync('SELECT title, description, skills FROM jobs WHERE id=?', [jobId]);
    if (!jobResults.length) {
      return res.send({ message: 'Application failed' });
    }

    const [job] = jobResults;
    const jobText = [job.title, job.description, job.skills].filter(Boolean).join(' ');

    try {
      const aiResponse = await axios.post('http://localhost:5001/match', {
        cv_text: cvData.cv_text,
        job_text: jobText,
        job_skills: job.skills,
      });

      const {
        score,
        skills_extracted: skillsExtracted,
        education,
        experience,
      } = aiResponse.data;

      await saveOrUpdateScore(applicationId, score);
      await queryAsync(
        `
          UPDATE cv_data
          SET skills_extracted=?, education=?, experience=?
          WHERE id=?
        `,
        [skillsExtracted, education, experience, cvData.id]
      );

      return res.send({ message: 'Applied successfully' });
    } catch (aiError) {
      console.log('AI service error:', aiError.message);
      return res.send({ message: 'Applied successfully (AI processing may be delayed)' });
    }
  } catch (error) {
    console.log('Apply flow error:', error.message);
    return res.send({ message: 'Application failed' });
  }
});

// GET /application-cv/:id
// Opens the original uploaded CV document for a specific application.
app.get('/application-cv/:id', (req, res) => {
  const applicationId = req.params.id;
  const query = `
    SELECT cv_data.file_path, cv_data.original_filename
    FROM applications
    JOIN cv_data ON cv_data.user_id = applications.user_id AND cv_data.is_profile_cv = true
    WHERE applications.id=?
    LIMIT 1
  `;

  // Database query: load the stored file reference for one application.
  db.query(query, [applicationId], (error, results) => {
    if (error || !results.length || !results[0].file_path) {
      return res.status(404).send('CV file not found');
    }

    const { file_path: filePath, original_filename: originalFileName } = results[0];
    const resolvedPath = path.resolve(__dirname, filePath);

    if (!resolvedPath.startsWith(uploadsDirectory) || !fs.existsSync(resolvedPath)) {
      return res.status(404).send('CV file not found');
    }

    return res.download(resolvedPath, originalFileName || path.basename(resolvedPath));
  });
});

// GET /job-hired-cv/:job_id
// Opens the hired applicant's original CV document for a closed job.
app.get('/job-hired-cv/:job_id', (req, res) => {
  const jobId = req.params.job_id;
  const query = `
    SELECT cv_data.file_path, cv_data.original_filename
    FROM applications
    JOIN cv_data ON cv_data.user_id = applications.user_id AND cv_data.is_profile_cv = true
    WHERE applications.job_id = ? AND applications.status = 'hired'
    LIMIT 1
  `;

  // Database query: load the hired applicant's stored CV for the selected job.
  db.query(query, [jobId], (error, results) => {
    if (error || !results.length || !results[0].file_path) {
      return res.status(404).send('Hired CV not found');
    }

    const { file_path: filePath, original_filename: originalFileName } = results[0];
    const resolvedPath = path.resolve(__dirname, filePath);

    if (!resolvedPath.startsWith(uploadsDirectory) || !fs.existsSync(resolvedPath)) {
      return res.status(404).send('Hired CV not found');
    }

    return res.download(resolvedPath, originalFileName || path.basename(resolvedPath));
  });
});

// GET /applications/:job_id
// Returns all applications using each applicant's latest profile CV.
app.get('/applications/:job_id', verifyToken, verifyRoleHR, async (req, res) => {
  const jobId = req.params.job_id;
  const query = `
    SELECT
      applications.id AS application_id,
      users.id AS user_id,
      users.name,
      cv_data.cv_text,
      cv_data.skills_extracted,
      cv_data.education,
      cv_data.experience,
      jobs.title,
      jobs.description,
      jobs.skills,
      applications.status,
      applications.shortlisted,
      scores.score
    FROM applications
    JOIN users ON users.id = applications.user_id
    JOIN jobs ON jobs.id = applications.job_id
    LEFT JOIN cv_data ON cv_data.user_id = applications.user_id AND cv_data.is_profile_cv = true
    LEFT JOIN scores ON scores.application_id = applications.id
    WHERE applications.job_id = ?
  `;

  try {
    const results = await queryAsync(query, [jobId]);

    const refreshedResults = await Promise.all(
      results.map(async (application) => {
        if (!application.cv_text) {
          return application;
        }

        const jobText = [application.title, application.description, application.skills]
          .filter(Boolean)
          .join(' ');

        try {
          const aiResponse = await axios.post('http://localhost:5001/match', {
            cv_text: application.cv_text,
            job_text: jobText,
            job_skills: application.skills,
          });

          const {
            score,
            skills_extracted: skillsExtracted,
            education,
            experience,
          } = aiResponse.data;

          await saveOrUpdateScore(application.application_id, score);
          await queryAsync(
            `
              UPDATE cv_data
              SET skills_extracted=?, education=?, experience=?
              WHERE user_id=? AND is_profile_cv = true
            `,
            [skillsExtracted, education, experience, application.user_id]
          );

          return {
            ...application,
            score,
            skills_extracted: skillsExtracted,
            education,
            experience,
          };
        } catch (aiError) {
          console.log('AI refresh error:', aiError.message);
          return application;
        }
      })
    );

    refreshedResults.sort((first, second) => (second.score || 0) - (first.score || 0));
    return res.send(refreshedResults);
  } catch (error) {
    console.log('Query error:', error);
    return res.send([]);
  }
});

// POST /shortlist/:id
// Flags an application as shortlisted for HR review.
app.post('/shortlist/:id', verifyToken, verifyRoleHR, (req, res) => {
  const applicationId = req.params.id;
  const query = 'UPDATE applications SET shortlisted = true WHERE id=?';

  // Database query: update the shortlisted flag on the selected application.
  db.query(query, [applicationId], (error) => {
    if (error) {
      return res.send({ message: 'Error shortlisting' });
    }

    return res.send({ message: 'Shortlisted' });
  });
});

// DELETE /shortlist/:id
// Removes an application from the HR shortlist without deleting the application.
app.delete('/shortlist/:id', verifyToken, verifyRoleHR, (req, res) => {
  const applicationId = req.params.id;
  const query = 'UPDATE applications SET shortlisted = false WHERE id=?';

  // Database query: clear only the shortlisted flag, keeping the application record.
  db.query(query, [applicationId], (error) => {
    if (error) {
      return res.send({ message: 'Error removing from shortlist' });
    }

    return res.send({ message: 'Removed from shortlist' });
  });
});

// POST /hire/:id
// Marks a shortlisted applicant as hired and closes the related job.
app.post('/hire/:id', verifyToken, verifyRoleHR, (req, res) => {
  const applicationId = req.params.id;
  const getApplicationQuery = 'SELECT job_id FROM applications WHERE id=?';
  const hireQuery = "UPDATE applications SET status='hired' WHERE id=?";
  const closeJobQuery = "UPDATE jobs SET status='closed' WHERE id=?";

  // Database query: load the application so the related job can also be closed.
  db.query(getApplicationQuery, [applicationId], (applicationError, applicationResults) => {
    if (applicationError || !applicationResults.length) {
      return res.send({ message: 'Error marking as hired' });
    }

    const jobId = applicationResults[0].job_id;

    // Database query: save the final hiring status for the selected applicant.
    db.query(hireQuery, [applicationId], (hireError) => {
      if (hireError) {
        return res.send({ message: 'Error marking as hired' });
      }

      // Database query: close the job once one shortlisted applicant is hired.
      db.query(closeJobQuery, [jobId], (closeError) => {
        if (closeError) {
          return res.send({ message: 'Error marking as hired' });
        }

        return res.send({ message: 'Applicant marked as hired' });
      });
    });
  });
});

// GET /my-applications/:user_id
// Lists the jobs an applicant has applied to, including status and date.
app.get('/my-applications/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT
      applications.id,
      jobs.title,
      jobs.status AS job_status,
      applications.status AS application_status,
      applications.shortlisted,
      applications.applied_at
    FROM applications
    JOIN jobs ON jobs.id = applications.job_id
    WHERE applications.user_id = ?
  `;

  // Database query: fetch application history for a single applicant.
  db.query(query, [userId], (error, results) => {
    if (error) {
      return res.send({ message: 'Error fetching applications' });
    }

    return res.send(results);
  });
});

// DELETE /delete-application/:id
// Removes an application entry from the system.
app.delete('/delete-application/:id', (req, res) => {
  const applicationId = req.params.id;
  const deleteScoreQuery = 'DELETE FROM scores WHERE application_id=?';
  const deleteApplicationQuery = 'DELETE FROM applications WHERE id=?';

  // Database query: delete the AI score record linked to this application.
  db.query(deleteScoreQuery, [applicationId], (scoreError) => {
    if (scoreError) {
      return res.send({ message: 'Error deleting' });
    }

    // Database query: remove the application without deleting the user's profile CV.
    db.query(deleteApplicationQuery, [applicationId], (applicationError) => {
      if (applicationError) {
        return res.send({ message: 'Error deleting' });
      }

      return res.send({ message: 'Application removed' });
    });
  });
});


// ===========================
// CV MANAGEMENT APIs
// ===========================

// GET /user-cv/:user_id
// Checks if user has uploaded a CV and returns CV data if exists.
app.get('/user-cv/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT cv_text, original_filename, file_path
    FROM cv_data
    WHERE user_id = ? AND is_profile_cv = true
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(query, [userId], (error, results) => {
    if (error) {
      return res.send({ hasCv: false });
    }

    if (results.length) {
      return res.send({ hasCv: true, cvText: results[0].cv_text, filename: results[0].original_filename, filePath: results[0].file_path });
    }

    return res.send({ hasCv: false });
  });
});

// GET /user-cv-file/:user_id
// Downloads the user's latest uploaded profile CV using the original filename/type.
app.get('/user-cv-file/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT file_path, original_filename
    FROM cv_data
    WHERE user_id = ? AND is_profile_cv = true
    ORDER BY id DESC
    LIMIT 1
  `;

  db.query(query, [userId], (error, results) => {
    if (error || !results.length || !results[0].file_path) {
      return res.status(404).send('CV file not found');
    }

    const { file_path: filePath, original_filename: originalFileName } = results[0];
    const resolvedPath = path.resolve(__dirname, filePath);

    if (!resolvedPath.startsWith(uploadsDirectory) || !fs.existsSync(resolvedPath)) {
      return res.status(404).send('CV file not found');
    }

    return res.download(resolvedPath, originalFileName || path.basename(resolvedPath));
  });
});

// POST /upload-cv
// Uploads or re-uploads a user's CV, replacing the old one if it exists.
app.post('/upload-cv', upload.single('cv'), async (req, res) => {
  const { user_id: userId } = req.body;

  if (!req.file) {
    return res.send({ success: false, message: 'CV file required' });
  }

  try {
    await ensureCvDataProfileSchema();
    const cvText = await extractText(req.file);

    // Load and remove the previously saved profile CV before inserting the new one.
    const getOldCvQuery = `
      SELECT file_path
      FROM cv_data
      WHERE user_id = ? AND is_profile_cv = true
      ORDER BY id DESC
    `;

    db.query(getOldCvQuery, [userId], (oldCvError, oldCvResults = []) => {
      if (oldCvError) {
        console.log('Load old CV error:', oldCvError);
      }

      const deleteOldQuery = 'DELETE FROM cv_data WHERE user_id = ? AND is_profile_cv = true';

      db.query(deleteOldQuery, [userId], (deleteError) => {
        if (deleteError) {
          console.log('Delete old CV error:', deleteError);
        }

        oldCvResults.forEach((oldCv) => {
          if (!oldCv.file_path) {
            return;
          }

          const resolvedPath = path.resolve(__dirname, oldCv.file_path);
          if (resolvedPath.startsWith(uploadsDirectory) && fs.existsSync(resolvedPath)) {
            fs.unlink(resolvedPath, (unlinkError) => {
              if (unlinkError) {
                console.log('Old profile CV cleanup error:', unlinkError.message);
              }
            });
          }
        });

        const saveCvQuery = `
          INSERT INTO cv_data (application_id, user_id, cv_text, file_path, original_filename, is_profile_cv)
          VALUES (NULL, ?, ?, ?, ?, true)
        `;

        db.query(saveCvQuery, [userId, cvText, req.file.path, req.file.originalname || null], (error) => {
          if (error) {
            console.log('CV upload insert error:', error.message);
            return res.send({ success: false, message: 'CV upload failed' });
          }

          return res.send({
            success: true,
            message: 'CV uploaded successfully',
            filename: req.file.originalname || 'CV',
            filePath: req.file.path,
          });
        });
      });
    });
  } catch (error) {
    console.log('File processing error:', error);
    return res.send({ success: false, message: 'File processing failed' });
  }
});


// ===========================
// SAVED JOB APIs
// ===========================

// POST /save-job
// Stores a job in the applicant's saved jobs list.
app.post('/save-job', (req, res) => {
  const { user_id: userId, job_id: jobId } = req.body;
  const checkQuery = 'SELECT job_id FROM saved_jobs WHERE user_id=? AND job_id=?';
  const insertQuery = 'INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)';

  // Database query: prevent duplicate saved-job rows.
  db.query(checkQuery, [userId, jobId], (checkError, checkResults) => {
    if (checkError) {
      return res.send({ message: 'Error' });
    }

    if (checkResults.length) {
      return res.send({ message: 'Saved already' });
    }

    // Database query: save the job for the applicant.
    db.query(insertQuery, [userId, jobId], (insertError) => {
      if (insertError) {
        return res.send({ message: 'Error' });
      }

      return res.send({ message: 'Job saved' });
    });
  });
});

// DELETE /remove-saved-job
// Removes a job from the saved jobs list.
app.delete('/remove-saved-job', (req, res) => {
  const { user_id: userId, job_id: jobId } = req.body;
  const query = 'DELETE FROM saved_jobs WHERE user_id=? AND job_id=?';

  // Database query: delete the saved-job mapping for the applicant.
  db.query(query, [userId, jobId], (error) => {
    if (error) {
      return res.send({ message: 'Error removing' });
    }

    return res.send({ message: 'Removed from saved' });
  });
});

// GET /saved-jobs/:user_id
// Returns full job records for jobs the applicant has saved.
app.get('/saved-jobs/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = `
    SELECT jobs.*
    FROM saved_jobs
    JOIN jobs ON jobs.id = saved_jobs.job_id
    WHERE saved_jobs.user_id = ?
  `;

  // Database query: join saved jobs to their job records for display.
  db.query(query, [userId], (error, results) => {
    if (error) {
      return res.send({ message: 'Error' });
    }

    return res.send(results);
  });
});


// ===========================
// ADMIN APIs
// ===========================

// GET /admin/users
// Returns the user list required by the admin dashboard.
app.get('/admin/users', verifyToken, verifyRoleAdmin, (req, res) => {
  const query = 'SELECT id, name, email, role, contact, company FROM users';

  // Database query: fetch user management data for admins.
  db.query(query, (error, results) => {
    if (error) {
      return res.send({ message: 'Error fetching users' });
    }

    return res.send(results);
  });
});

// DELETE /admin/delete-user/:id
// Deletes a user from the platform.
app.delete('/admin/delete-user/:id', verifyToken, verifyRoleAdmin, (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id=?';

  // Database query: remove the selected user account.
  db.query(query, [userId], (error) => {
    if (error) {
      return res.send({ message: 'Error deleting user' });
    }

    return res.send({ message: 'User deleted' });
  });
});

// GET /admin/stats
// Aggregates simple dashboard counts for admin overview cards.
app.get('/admin/stats', verifyToken, verifyRoleAdmin, (req, res) => {
  const statsQueries = [
    { key: 'applicants', sql: "SELECT COUNT(*) AS count FROM users WHERE role='applicant'" },
    { key: 'hr', sql: "SELECT COUNT(*) AS count FROM users WHERE role='hr'" },
    { key: 'admins', sql: "SELECT COUNT(*) AS count FROM users WHERE role='admin'" },
    { key: 'users', sql: 'SELECT COUNT(*) AS count FROM users' },
    { key: 'jobs', sql: 'SELECT COUNT(*) AS count FROM jobs' },
    { key: 'applications', sql: 'SELECT COUNT(*) AS count FROM applications' },
  ];

  const stats = {};
  let completedQueries = 0;

  // Database queries: run small aggregate counts and combine them into one response.
  statsQueries.forEach((statQuery) => {
    db.query(statQuery.sql, (error, results) => {
      if (!error) {
        stats[statQuery.key] = results[0].count;
      }

      completedQueries += 1;

      if (completedQueries === statsQueries.length) {
        res.send(stats);
      }
    });
  });
});


// ===========================
// SERVER STARTUP
// ===========================

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
