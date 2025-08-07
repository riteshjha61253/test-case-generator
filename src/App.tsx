import { useEffect, useState } from 'react';

// Type for GitHub repo object (you can extend this later)
interface GitHubRepo {
  id: number;
  full_name: string;
  [key: string]: any; // fallback for untyped fields
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);

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

  const fetchRepos = async () => {
    try {
      const response = await fetch('http://localhost:4000/repos', {
        headers: {
          Authorization: token || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repos');
      }

      const data: GitHubRepo[] = await response.json();
      setRepos(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Case Generator</h1>
      {!token ? (
        <button onClick={handleLogin}>Login with GitHub</button>
      ) : (
        <>
          <button onClick={fetchRepos}>Fetch My Repositories</button>
          <ul>
            {repos.map((repo) => (
              <li key={repo.id}>{repo.full_name}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
