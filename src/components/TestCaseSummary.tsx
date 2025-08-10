import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Code,
  GitPullRequest,
  Loader2,
  TestTube,
} from 'lucide-react';
import { type GitHubRepo } from '../types';
import { toast } from 'react-toastify';

interface TestCaseSummaryProps {
  testCases: any[];
  token: string;
  repo: GitHubRepo | null;
  onGenerateCode: (code: string) => void;
}

const TestCaseSummary: React.FC<TestCaseSummaryProps> = ({
  testCases,
  token,
  repo,
  onGenerateCode,
}) => {
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [creatingPR, setCreatingPR] = useState(false);
  const [testCode, setTestCode] = useState<string | null>(null);

  useEffect(() => {
    console.log('Loaded test cases:', testCases);
  }, [testCases]);

  const selectedTestCase = testCases.find((tc) => tc.title === selectedTitle);

  const handleGenerateCode = async (testCase: any) => {
    console.log('Generating code for:', testCase.title);
    setGeneratingCode(testCase.title);
    try {
      const response = await fetch('http://localhost:4000/generate-test-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          owner: repo?.owner.login,
          repo: repo?.name,
          testCase,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate test case code');
      const { testCode } = await response.json();
      setTestCode(testCode);
      onGenerateCode(testCode);
      toast.success('Test case code generated successfully!');
    } catch (error) {
      console.error('Error generating test case code:', error);
      toast.error('Failed to generate test case code');
    } finally {
      setGeneratingCode(null);
    }
  };

  const handleCreatePR = async () => {
    if (!selectedTestCase || !repo) {
      console.warn('No test case or repo selected');
      return;
    }

    console.log('Creating PR for:', selectedTestCase.title);
    setCreatingPR(true);
    try {
      const response = await fetch('http://localhost:4000/create-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          testCase: selectedTestCase,
        }),
      });
      if (!response.ok) throw new Error('Failed to create PR');
      const { prUrl } = await response.json();
      alert(`PR created: ${prUrl}`);
    } catch (error) {
      console.error('Error creating PR:', error);
    } finally {
      setCreatingPR(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TestTube className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Test Case Summaries</h2>
        </div>
        {selectedTestCase && (
          <button
            onClick={handleCreatePR}
            disabled={creatingPR}
            className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {creatingPR ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating PR...
              </>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" />
                Create Pull Request
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {testCases.map((testCase, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${selectedTitle === testCase.title
              ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200'
              : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
              }`}
            onClick={() => {
              console.log('Selected test case:', testCase.title);
              setSelectedTitle(testCase.title);
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{testCase.title}</h3>
                  {selectedTitle === testCase.title && (
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {testCase.summary}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateCode(testCase);
                }}
                disabled={generatingCode === testCase.title}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {generatingCode === testCase.title ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Generate Code
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Selected Test Case: {selectedTestCase?.title || 'None'}
      </div>
    </div>
  );
};

export default TestCaseSummary;
