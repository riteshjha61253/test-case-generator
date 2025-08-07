import { useEffect, useState } from 'react';
import RepoList from './components/RepoList';
import FileList from './components/FileList';
import TestCaseSummary from './components/TestCaseSummary';
import './App.css';

// Type for GitHub repo
interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get('token');
    if (tokenFromURL) {
      setToken(tokenFromURL);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/github';
  };

  return (
    <div className="app-container">
      <h1>Test Case Generator</h1>
      {!token ? (
        <button className="btn" onClick={handleLogin}>Login with GitHub</button>
      ) : (
        <div className="content">
          <RepoList token={token} onSelectRepo={setSelectedRepo} />
          {selectedRepo && (
            <FileList
              token={token}
              repo={selectedRepo}
              onGenerateTestCases={setTestCases}
            />
          )}
          {testCases.length > 0 && (
            <TestCaseSummary
              testCases={testCases}
              token={token}
              repo={selectedRepo}
              onGenerateCode={setGeneratedCode}
            />
          )}
          {generatedCode && (
            <div className="code-output">
              <h3>Generated Test Case Code</h3>
              <pre>{generatedCode}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;