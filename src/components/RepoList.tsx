import { useEffect, useState } from 'react';
import { type GitHubRepo } from '../types';

interface RepoListProps {
  token: string;
  onSelectRepo: (repo: GitHubRepo) => void;
}

const RepoList: React.FC<RepoListProps> = ({ token, onSelectRepo }) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:4000/repos', {
          headers: { Authorization: token },
        });
        if (!response.ok) throw new Error('Failed to fetch repos');
        const data: GitHubRepo[] = await response.json();
        setRepos(data);
      } catch (error) {
        console.error('Error fetching repos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, [token]);

  return (
    <div className="repo-list">
      <h2>Your Repositories</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {repos.map((repo) => (
            <li key={repo.id} onClick={() => onSelectRepo(repo)} className="repo-item">
              {repo.full_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RepoList;