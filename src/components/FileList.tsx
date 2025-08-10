import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Play } from 'lucide-react';
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
  const [generating, setGenerating] = useState(false);

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

    setGenerating(true);
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
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Files in {repo.full_name}
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading files...</span>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <label
                key={file.path}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={() => handleFileSelect(file.path)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {file.name}
                </span>
                {selectedFiles.includes(file.path) && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleGenerateTestCases}
              disabled={selectedFiles.length === 0 || generating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Test Cases
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileList;
