import { useEffect, useState } from 'react';
import { type GitHubRepo } from '../types';

interface File {
  name: string;
  path: string;
  content: string;
}

interface FileListProps {
  token: string;
  repo: GitHubRepo;
  onGenerateTestCases: (testCases: any[]) => void;
}

const FileList: React.FC<FileListProps> = ({ token, repo, onGenerateTestCases }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:4000/repo-files?owner=${repo.owner.login}&repo=${repo.name}`,
          {
            headers: { Authorization: token },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch files');
        const data: File[] = await response.json();
        setFiles(data);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [token, repo]);

  const handleFileSelect = (path: string) => {
    setSelectedFiles((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleGenerateTestCases = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }
    try {
      const response = await fetch('http://localhost:4000/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          files: selectedFiles,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate test cases');
      const testCases = await response.json();
      onGenerateTestCases(testCases);
    } catch (error) {
      console.error('Error generating test cases:', error);
    }
  };

  return (
    <div className="file-list">
      <h2>Files in {repo.full_name}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <ul>
            {files.map((file) => (
              <li key={file.path}>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={() => handleFileSelect(file.path)}
                />
                {file.name}
              </li>
            ))}
          </ul>
          <button className="btn" onClick={handleGenerateTestCases} disabled={selectedFiles.length === 0}>
            Generate Test Cases
          </button>
        </>
      )}
    </div>
  );
};

export default FileList;