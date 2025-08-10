const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path"); // ✅ Added
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!CLIENT_ID || !CLIENT_SECRET || !GEMINI_API_KEY) {
  console.error("Missing environment variables");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// GitHub OAuth
app.get("/auth/github", (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=public_repo`;
  res.redirect(redirectUrl);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } }
    );
    const accessToken = response.data.access_token;
    res.redirect(`/?token=${accessToken}`); // ✅ works after deploy
  } catch (err) {
    res.status(500).send("Authentication failed");
  }
});

app.post("/generate-test-code", async (req, res) => {
  const { owner, repo, testCase } = req.body;
  const token = req.headers.authorization;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fileRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${testCase.filePath}`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );

    const content = Buffer.from(fileRes.data.content, "base64").toString("utf8");

    const prompt = `Generate test code for the following test case:\n\nTitle: ${testCase.title}\nSummary: ${testCase.summary}\n\nFile: ${testCase.filePath}\n\nCode:\n${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const testCode = response
      .text()
      .replace(/```(?:[a-z]*)?\n?|```/g, "")
      .trim();

    res.json({ testCode });
  } catch (err) {
    console.error("Error generating test code:", err.message);
    res.status(500).send("Error generating test code");
  }
});

app.get("/repos", async (req, res) => {
  const token = req.headers.authorization;
  try {
    const repos = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${token}` },
    });
    res.json(repos.data);
  } catch (err) {
    res.status(500).send("Error fetching repos");
  }
});

// Fetch files from a repository
app.get("/repo-files", async (req, res) => {
  const { owner, repo } = req.query;
  const token = req.headers.authorization;
  try {
    const files = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    const codeFiles = [];
    for (const file of files.data) {
      if (file.type === "file" && /\.(js|ts|tsx|py)$/i.test(file.name)) {
        const content = await axios.get(file.download_url);
        codeFiles.push({
          name: file.name,
          path: file.path,
          content: content.data,
        });
      }
    }
    res.json(codeFiles);
  } catch (err) {
    res.status(500).send("Error fetching files");
  }
});

app.post("/generate-test-cases", async (req, res) => {
  const { owner, repo, files } = req.body;
  const token = req.headers.authorization;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const testCases = await Promise.all(
      files.map(async (filePath) => {
        try {
          const fileRes = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
            {
              headers: { Authorization: `token ${token}` },
            }
          );

          const content = Buffer.from(fileRes.data.content, "base64").toString(
            "utf8"
          );

          const prompt = `Analyze the following code and suggest test cases (e.g., JUnit for JavaScript/TypeScript, Selenium for Python). Return a JSON array of objects with "title" and "summary" fields. Ensure the output is valid JSON without markdown code fences:\n\n${content}`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          let text = response
            .text()
            .replace(/```json\n?|```/g, "")
            .trim();

          let suggestions = [];
          try {
            suggestions = JSON.parse(text);
            if (!Array.isArray(suggestions)) throw new Error("Not an array");
          } catch (parseErr) {
            console.warn(`Parsing error for ${filePath}:`, parseErr.message);
            suggestions = [
              {
                title: "Default Test Case",
                summary: "Could not parse Gemini response.",
                filePath,
              },
            ];
          }

          return suggestions.map((tc) => ({ ...tc, filePath }));
        } catch (err) {
          console.error(`Error processing ${filePath}:`, err.message);
          return [
            {
              title: "Error Test Case",
              summary: `Failed to process file: ${err.message}`,
              filePath,
            },
          ];
        }
      })
    );

    res.json(testCases.flat());
  } catch (err) {
    console.error("Error in /generate-test-cases:", err.message);
    res.status(500).send("Error generating test cases");
  }
});

app.post("/create-pr", async (req, res) => {
  const { owner, repo, testCase } = req.body;
  const token = req.headers.authorization;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const file = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${testCase.filePath}`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    const content = Buffer.from(file.data.content, "base64").toString("utf8");
    const prompt = `Generate test case code for:\n\nFile: ${testCase.filePath}\nTitle: ${testCase.title}\nSummary: ${testCase.summary}\nCode:\n${content}`;
    const result = await model.generateContent(prompt);
    const testCode = await result.response.text();

    const branchName = `test-case-${Date.now()}`;
    const filePath = `test/${testCase.filePath.replace(
      /\.[^/.]+$/,
      ""
    )}_test.js`;

    // Create branch
    const ref = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`,
      {
        headers: { Authorization: `token ${token}` },
      }
    );
    const sha = ref.data.object.sha;
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      { ref: `refs/heads/${branchName}`, sha },
      { headers: { Authorization: `token ${token}` } }
    );

    // Create file
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        message: `Add test case for ${testCase.title}`,
        content: Buffer.from(testCode).toString("base64"),
        branch: branchName,
      },
      { headers: { Authorization: `token ${token}` } }
    );

    // Create PR
    const pr = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        title: `Add test case: ${testCase.title}`,
        head: branchName,
        base: "main",
        body: `Generated test case for ${testCase.filePath}\n\n${testCase.summary}`,
      },
      { headers: { Authorization: `token ${token}` } }
    );

    res.json({ prUrl: pr.data.html_url });
  } catch (err) {
    res.status(500).send("Error creating PR");
  }
});

// ✅ Catch-all for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
