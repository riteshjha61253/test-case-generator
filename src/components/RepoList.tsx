import { useEffect, useState } from 'react';
import { GitBranch, Loader2, WarehouseIcon as Repository } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Repository className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">Your Repositories</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-gray-600">Loading repositories...</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-green-900 transition-colors">
                    {repo.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Click to select this repository
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RepoList;
