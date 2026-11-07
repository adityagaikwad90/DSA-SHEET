import { executeGeminiPrompt } from './geminiClient';

/**
 * Available Agent Personas for the DSA Learning Platform
 */
export const AGENT_PERSONAS = [
  {
    id: 'faang_interviewer',
    label: 'FAANG Interviewer',
    badge: 'Senior Staff Rubric',
    description: 'Strict Google/Meta interview bar: focus on edge cases, architecture, and complexity tradeoffs.',
    systemRole: `You are an elite Senior Staff Software Engineer and Technical Interviewer conducting a mock technical interview at Google/Meta.
Evaluate code using the official FAANG interview rubric:
1. Problem Solving & Approach: Did the candidate pick the optimal pattern?
2. Coding Hygiene & Idiomatic Standards: Clean variable naming, no dead code, modular design.
3. Complexity Proofs: Rigorous, mathematically sound Big-O Time & Space analysis.
4. Edge Case Handling: Boundary checks, overflow, empty inputs.`
  },
  {
    id: 'socratic_mentor',
    label: 'Socratic Mentor',
    badge: 'Guiding Hints',
    description: 'Acts as an encouraging coach who asks probing questions and offers hints without giving away the answer.',
    systemRole: `You are a patient and brilliant Algorithms Professor and Socratic Mentor.
Your teaching philosophy:
- Avoid immediately giving away the full answer or optimal code unless the user explicitly requested it.
- Ask 1-2 thought-provoking questions that guide the candidate to realize where their logic breaks or how to optimize.
- Explain the intuition behind the pattern with analogies.`
  },
  {
    id: 'speed_optimizer',
    label: 'Speed Optimizer',
    badge: '100% LeetCode',
    description: 'Competitive programming specialist targeting maximum cache locality, bitwise tricks, and 0ms runtime.',
    systemRole: `You are an International Grandmaster Competitive Programmer and Low-Level Performance Specialist.
Your focus:
- Maximum algorithmic speed and lowest memory overhead.
- Cache-friendly iterations, early exits, avoiding unnecessary heap allocations, and zero-allocation techniques.
- How to reach the 99-100th percentile runtime on online judges.`
  },
  {
    id: 'bug_hunter',
    label: 'Edge-Case Hunter',
    badge: 'Stress Tester',
    description: 'Red-teams code with pathological inputs: integer overflows, duplicates, negative numbers, and boundary limits.',
    systemRole: `You are a Principal QA Engineer and Software Reliability Auditor.
Your focus:
- Find pathological inputs that break the candidate's code.
- Explicitly trace 3-4 edge cases (e.g. empty inputs, duplicate elements, negative numbers, extreme scale, off-by-one errors) through the candidate's code line-by-line.`
  }
];

/**
 * Assistance / Code Reveal Tiers
 */
export const ASSISTANCE_LEVELS = [
  {
    id: 'hints_only',
    label: 'Hints Only',
    badge: 'Level 1',
    description: 'High-level conceptual guidance without solution code'
  },
  {
    id: 'pseudocode',
    label: 'Pseudocode',
    badge: 'Level 2',
    description: 'Structural algorithmic blueprint & loop invariants'
  },
  {
    id: 'full_code',
    label: 'Full Solution',
    badge: 'Level 3',
    description: 'Complete optimal production code in candidate or requested language'
  }
];

/**
 * Extracts and classifies comments & directives from source code
 * @param {string} code
 * @returns {object} { comments: string[], detectedDirectives: string[], requestedLanguage: string|null }
 */
export function extractCodeDirectives(code = '') {
  const lines = code.split('\n');
  const comments = [];
  const detectedDirectives = [];
  let requestedLanguage = null;

  const commentRegex = /^(?:\s*)(?:\/\/|#|--|\/\*|\*)\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(commentRegex);
    if (match && match[1]) {
      const text = match[1].trim();
      if (text.length > 0 && !text.startsWith('Write your solution')) {
        comments.push(text);

        const lower = text.toLowerCase();
        // Check for language translation requests
        if (lower.includes('java solution') || lower.includes('in java') || lower.includes('convert to java')) {
          requestedLanguage = 'Java';
          detectedDirectives.push('Translate solution into idiomatic Java');
        } else if (lower.includes('python solution') || lower.includes('in python') || lower.includes('convert to python')) {
          requestedLanguage = 'Python 3';
          detectedDirectives.push('Translate solution into idiomatic Python');
        } else if (lower.includes('c++ solution') || lower.includes('in cpp') || lower.includes('in c++') || lower.includes('convert to c++')) {
          requestedLanguage = 'C++ 20';
          detectedDirectives.push('Translate solution into modern C++');
        } else if (lower.includes('javascript solution') || lower.includes('in js') || lower.includes('in javascript')) {
          requestedLanguage = 'JavaScript';
          detectedDirectives.push('Translate solution into JavaScript');
        }

        // Check for specific problem inquiries
        if (lower.includes('why') || lower.includes('how') || lower.includes('what') || lower.includes('can we') || lower.includes('is this')) {
          detectedDirectives.push(`Direct Question: "${text}"`);
        }
      }
    }
  }

  return { comments, detectedDirectives, requestedLanguage };
}

/**
 * Runs the Multi-Stage DSA Agent Pipeline
 * @param {object} params
 * @returns {Promise<string>} Markdown formatted review
 */
export async function runDsaAgentPipeline({
  apiKey,
  code,
  language,
  question,
  personaId = 'faang_interviewer',
  assistanceLevel = 'full_code',
  onProgress = () => {}
}) {
  const persona = AGENT_PERSONAS.find(p => p.id === personaId) || AGENT_PERSONAS[0];
  const assistance = ASSISTANCE_LEVELS.find(a => a.id === assistanceLevel) || ASSISTANCE_LEVELS[2];

  // Stage 1: Parse Directives
  onProgress('extracting_directives', 'Stage 1/3: Extracting user directives & comments...');
  const { comments, detectedDirectives, requestedLanguage } = extractCodeDirectives(code);

  const problemContext = question
    ? `Problem: "${question.title || question.question}"
Company Origin: ${question.company || 'General Tech'}
Difficulty: ${question.difficulty || 'Medium'}
Pattern / Topics: ${Array.isArray(question.topics) ? question.topics.join(', ') : 'DSA'}`
    : 'DSA Problem Practice';

  // Build Assistance Level constraints
  let assistanceGuideline = '';
  if (assistanceLevel === 'hints_only') {
    assistanceGuideline = `CRITICAL ASSISTANCE CONSTRAINT: The candidate selected "Hints Only (Level 1)".
- DO NOT provide the complete working code solution in your response.
- Instead, provide conceptual hints, step-by-step logic, and targeted questions to help them code it themselves.
- (Exception: If the candidate explicitly asked for code in a comment like "// give me java solution", you MAY provide the requested snippet under the Questions section).`;
  } else if (assistanceLevel === 'pseudocode') {
    assistanceGuideline = `CRITICAL ASSISTANCE CONSTRAINT: The candidate selected "Pseudocode (Level 2)".
- Provide high-level pseudocode and data structure blueprints instead of full copy-pasteable production code.`;
  } else {
    assistanceGuideline = `CRITICAL ASSISTANCE CONSTRAINT: The candidate selected "Full Solution (Level 3)".
- Provide the optimal, fully commented production code solution with line-by-line complexity analysis.`;
  }

  // Build Directives instruction
  let directivesGuideline = '';
  if (comments.length > 0) {
    directivesGuideline = `
IMPORTANT - USER COMMENTS DETECTED IN CODE:
The candidate included the following comments/inquiries in their code:
${comments.map(c => `• "${c}"`).join('\n')}

Detected Intent Directives:
${detectedDirectives.length > 0 ? detectedDirectives.map(d => `• ${d}`).join('\n') : '• Answer any questions embedded in the comments'}
${requestedLanguage ? `• Specifically requested translation to: ${requestedLanguage}` : ''}

👉 MANDATORY REQUIREMENT:
You MUST create a dedicated section at the very top of your review:
### 💬 Answers to Your Code Inquiries & Requests
Directly answer every question or translation request found in the comments! If they asked for a solution in another language (e.g. Java), provide the complete, clean code in that language here first.`;
  }

  // Stage 2: Simulating Test Cases
  onProgress('evaluating_testcases', 'Stage 2/3: Stress-testing edge cases & pathological inputs...');

  const prompt = `${persona.systemRole}

You are analyzing a candidate's solution for the following challenge:
${problemContext}
Language: ${language}

Candidate Code:
\`\`\`${language}
${code}
\`\`\`

${assistanceGuideline}

${directivesGuideline}

Review Guidelines & Output Format (Rendered in clean GitHub-Flavored Markdown):
${comments.length > 0 ? '1. **💬 Answers to Your Inquiries & Comment Requests** (Address user comments first!)' : ''}
2. **Complexity Verdict**: Exact Time & Space Big-O analysis with clear mathematical proof.
3. **Correctness & Pathological Edge Cases**: 
   - State whether the solution passes.
   - Walk through at least 2 concrete edge cases (e.g., empty array, single element, negative numbers, duplicates).
4. **Interviewer Evaluation & Feedback** (${persona.label} Style):
   - Highlight strengths and specific algorithmic bottlenecks.
5. **Optimal Solution Blueprint**:
   - Provide the optimal approach according to the assistance level (${assistance.label}).`;

  // Stage 3: Synthesizing Review
  onProgress('synthesizing_review', 'Stage 3/3: Synthesizing interview rubric review...');

  const reviewText = await executeGeminiPrompt({
    apiKey,
    prompt,
    systemInstruction: persona.systemRole
  });

  return reviewText;
}

