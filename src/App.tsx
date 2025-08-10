import { useEffect, useState } from 'react';
import { Github, TestTube2, Copy } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RepoList from './components/RepoList';
import FileList from './components/FileList';
import TestCaseSummary from './components/TestCaseSummary';
import { type GitHubRepo, type TestCase } from './types';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromURL = urlParams.get('token');
    if (tokenFromURL) {
      setToken(tokenFromURL);
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    console.log('Generated code updated:', generatedCode);
  }, [generatedCode]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/github';
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      toast.success('Code copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TestTube2 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Test Case Generator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatically generate comprehensive test cases for your GitHub repositories
          </p>
        </div>

        {!token ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Github className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Connect Your GitHub
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in with your GitHub account to start generating test cases for your repositories.
              </p>
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-3 px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <Github className="w-5 h-5" />
                Login with GitHub
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">

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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TestTube2 className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Generated Test Case Code
                  </h3>
                </div>
                {generatedCode && (
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </button>
                )}
              </div>
              {generatedCode ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100 whitespace-pre-wrap">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  No test case code generated yet. Select a test case and click "Generate Code" to view the code here.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;