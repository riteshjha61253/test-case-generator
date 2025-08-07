import { useState } from 'react';
import { type GitHubRepo } from '../types';

interface TestCaseSummaryProps {
  testCases: any[];
  token: string;
  repo: GitHubRepo | null;
  onGenerateCode: (code: string) => void;
}

const TestCaseSummary: React.FC<TestCaseSummaryProps> = ({ testCases, token, repo, onGenerateCode }) => {
  const [selectedTestCase, setSelectedTestCase] = useState<any | null>(null);

  const handleGenerateCode = async (testCase: any) => {
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
      const { code } = await response.json();
      onGenerateCode(code);
    } catch (error) {
      console.error('Error generating test case code:', error);
    }
  };

  const handleCreatePR = async () => {
    if (!selectedTestCase || !repo) return;
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
    }
  };

  return (
    <div className="test-case-summary">
      <h2>Test Case Summaries</h2>
      <ul>
        {testCases.map((testCase, index) => (
          <li
            key={index}
            className={selectedTestCase === testCase ? 'selected' : ''}
            onClick={() => setSelectedTestCase(testCase)}
          >
            <strong>{testCase.title}</strong>: {testCase.summary}
            <button className="btn" onClick={() => handleGenerateCode(testCase)}>
              Generate Code
            </button>
          </li>
        ))}
      </ul>
      {selectedTestCase && (
        <button className="btn" onClick={handleCreatePR}>
          Create PR (Bonus)
        </button>
      )}
    </div>
  );
};

export default TestCaseSummary;