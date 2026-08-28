export interface GenerateCampaignParams {
  campaignName: string;
  tone?: string;
  targetAudience?: string;
  keyPoints?: string;
  callToAction?: string;
}

export interface GeneratedCampaignResult {
  subject: string;
  body: string;
  previewSnippet?: string;
}

export interface SubjectLineOption {
  subject: string;
  style: string;
  estimatedImpact: string;
  reasoning: string;
}

export interface ImproveCopyParams {
  currentText: string;
  action: 'improve' | 'shorter' | 'casual' | 'persuasive' | 'formal' | 'fix_grammar';
  targetTone?: string;
}

export interface ImproveCopyResult {
  improvedText: string;
  summaryOfChanges?: string;
}

function extractErrorMessage(errorData: any, status: number): string {
  if (typeof errorData?.error === 'string') {
    // Check if error is serialized JSON
    if (errorData.error.startsWith('{') && errorData.error.includes('"message"')) {
      try {
        const inner = JSON.parse(errorData.error);
        if (inner?.error?.message) return inner.error.message;
        if (inner?.message) return inner.message;
      } catch {}
    }
    return errorData.error;
  }
  if (errorData?.message) return errorData.message;
  return `AI Service Error (${status}). Please try again.`;
}

/**
 * Generate full campaign subject line and body using server-side Gemini API.
 */
export async function generateCampaignWithGemini(
  params: GenerateCampaignParams
): Promise<GeneratedCampaignResult> {
  const response = await fetch('/api/gemini/generate-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, response.status));
  }

  return response.json();
}

/**
 * Generate multiple subject line variations with impact estimates using Gemini.
 */
export async function generateSubjectLinesWithGemini(
  campaignName: string,
  body: string = '',
  goal: string = 'High open rate'
): Promise<SubjectLineOption[]> {
  const response = await fetch('/api/gemini/subject-lines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignName, body, goal }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, response.status));
  }

  const data = await response.json();
  return data.subjectLines || [];
}

/**
 * Improve or rewrite existing text using server-side Gemini AI.
 */
export async function improveCopyWithGemini(
  params: ImproveCopyParams
): Promise<ImproveCopyResult> {
  const response = await fetch('/api/gemini/improve-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData, response.status));
  }

  return response.json();
}
