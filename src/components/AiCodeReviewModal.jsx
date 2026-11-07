import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  X,
  Sparkles,
  Code2,
  Check,
  Copy,
  AlertTriangle,
  ShieldCheck,
  Zap,
  RotateCcw,
  Briefcase,
  GraduationCap,
  Sliders,
  Bot
} from 'lucide-react';
import { AGENT_PERSONAS, ASSISTANCE_LEVELS, runDsaAgentPipeline } from '../utils/dsaAgentEngine';
import SafeMarkdownRenderer from './SafeMarkdownRenderer';
import './AiCodeReviewModal.css';

const DEFAULT_CODE_STARTERS = {
  python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
  java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
  javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`
};

export default function AiCodeReviewModal({ question = null, isOpen = false, onClose = () => {} }) {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE_STARTERS.python);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('faang_interviewer');
  const [selectedAssistance, setSelectedAssistance] = useState('full_code');
  const [agentStage, setAgentStage] = useState('');

  if (!isOpen) return null;

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(DEFAULT_CODE_STARTERS[newLang] || '// Write your solution here');
  };

  const handleAnalyze = async () => {
    if (!code || !code.trim()) return;

    setAnalyzing(true);
    setAnalysisResult('');
    setAgentStage('Stage 1/3: Initializing agent reasoning & directive scanner...');

    try {
      const apiKey = localStorage.getItem('CUSTOM_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAnalysisResult(`### ⚠️ Gemini API Key Missing
Please add your API key in the AI Copilot settings orb (bottom right) or set \`VITE_GEMINI_API_KEY\` in your \`.env\` file.`);
        setAnalyzing(false);
        return;
      }

      const reviewText = await runDsaAgentPipeline({
        apiKey,
        code,
        language,
        question,
        personaId: selectedPersona,
        assistanceLevel: selectedAssistance,
        onProgress: (stage, message) => setAgentStage(message)
      });

      setAnalysisResult(reviewText);
    } catch (err) {
      console.error('Code review error:', err);
      setAnalysisResult(`### ⚠️ Review Request Failed
${err.message || 'Unable to connect to Google Gemini. Please check your API key or network connection.'}`);
    } finally {
      setAnalyzing(false);
      setAgentStage('');
    }
  };

  const currentPersonaObj = AGENT_PERSONAS.find(p => p.id === selectedPersona) || AGENT_PERSONAS[0];

  return (
    <div className="code-review-overlay" onClick={onClose}>
      <div className="code-review-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="code-review-header">
          <div className="code-review-title-group">
            <div className="code-review-badge">
              <Sparkles size={14} />
              <span>Neural Reviewer</span>
            </div>
            <h3 className="code-review-title">
              AI Code Review {question?.title ? `— ${question.title}` : ''}
            </h3>
          </div>

          <button className="code-review-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="code-review-toolbar">
          <div className="toolbar-left">
            <div className="toolbar-item">
              <label className="toolbar-label">Language:</label>
              <select value={language} onChange={handleLanguageChange} className="lang-select">
                <option value="python">Python 3</option>
                <option value="cpp">C++ 20</option>
                <option value="java">Java 17</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            {/* Agent Persona Selector */}
            <div className="agent-persona-group">
              <span className="toolbar-label">Persona:</span>
              <div className="persona-buttons">
                {AGENT_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    className={`persona-btn ${selectedPersona === p.id ? 'active' : ''}`}
                    onClick={() => setSelectedPersona(p.id)}
                    title={p.description}
                  >
                    {p.id === 'faang_interviewer' && <Briefcase size={12} />}
                    {p.id === 'socratic_mentor' && <GraduationCap size={12} />}
                    {p.id === 'speed_optimizer' && <Zap size={12} />}
                    {p.id === 'bug_hunter' && <ShieldCheck size={12} />}
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assistance Level Toggle */}
            <div className="assistance-level-group">
              <span className="toolbar-label">Assistance:</span>
              <div className="tier-buttons">
                {ASSISTANCE_LEVELS.map(a => (
                  <button
                    key={a.id}
                    className={`tier-btn ${selectedAssistance === a.id ? 'active' : ''}`}
                    onClick={() => setSelectedAssistance(a.id)}
                    title={a.description}
                  >
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            className="run-review-btn btn-spring"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            <Bot size={16} />
            <span>{analyzing ? 'Agent Reasoning...' : 'Run Agent Analysis'}</span>
          </button>
        </div>

        {/* Split Workbench: Monaco Editor Left, AI Review Right */}
        <div className="code-review-workbench">
          <div className="workbench-editor-pane">
            <div className="pane-header">
              <Code2 size={14} />
              <span>Candidate Solution Editor &amp; Comments</span>
            </div>
            <div className="editor-container">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={val => setCode(val || '')}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  tabSize: 4,
                  padding: { top: 12, bottom: 12 }
                }}
              />
            </div>
          </div>

          <div className="workbench-review-pane">
            <div className="pane-header">
              <Sparkles size={14} />
              <span>DSA Agent Analysis ({currentPersonaObj.label})</span>
            </div>
            <div className="review-output-content">
              {analyzing ? (
                <div className="review-loading-state">
                  <div className="agent-pulse-icon-wrap">
                    <Bot size={32} className="agent-pulse-bot" />
                    <span className="agent-live-pulse-dot" />
                  </div>
                  <h4 className="agent-loading-heading">AI Agent Pipeline Active</h4>
                  <p className="agent-loading-stage">{agentStage || 'Executing multi-stage analysis...'}</p>
                  <div className="agent-progress-track">
                    <div className="agent-progress-indicator" />
                  </div>
                  <div className="agent-persona-badge-preview">
                    Active Persona: <strong>{currentPersonaObj.label}</strong> • {currentPersonaObj.badge}
                  </div>
                </div>
              ) : analysisResult ? (
                <SafeMarkdownRenderer content={analysisResult} />
              ) : (
                <div className="review-placeholder">
                  <Bot size={40} className="placeholder-icon" />
                  <h4 className="placeholder-title">DSA AI Agent Ready</h4>
                  <p className="placeholder-text">
                    Select your preferred <strong>Interviewer Persona</strong> and <strong>Assistance Tier</strong> above, then click "Run Agent Analysis". The agent will parse your code comments, stress-test edge cases, and deliver a personalized FAANG interview critique.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

