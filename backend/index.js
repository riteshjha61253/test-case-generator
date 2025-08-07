const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
console.log('GitHub Client ID:', CLIENT_ID);
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
console.log('GitHub Client Secret:', CLIENT_SECRET);
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('GitHub Client ID or Secret is not set in .env file');
  process.exit(1);
}
app.get('/auth/github', (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
  res.redirect(redirectUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = response.data.access_token;
    res.redirect(`http://localhost:5173?token=${accessToken}`);
  } catch (err) {
    res.status(500).send('Authentication failed');
  }
});

app.get('/repos', async (req, res) => {
  const token = req.headers.authorization;

  try {
    const repos = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    res.json(repos.data);
  } catch (err) {
    res.status(500).send('Error fetching repos');
  }
});

app.listen(4000, () => {
  console.log('Backend running on http://localhost:4000');
});
