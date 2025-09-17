/**
 * Clean Gemini (PaLM / Vertex) client adapter
/**
 * Gemini REST client (clean, single-file implementation)
 */

import type { CareerRecommendation } from '../types/careerRecommendation';
import { CareerRecommendationValidator } from '../types/careerRecommendation';

export type GeminiClientOptions = {
  apiKey: string;
  model?: string; // e.g. "models/gemini-2.5-flash-lite"
  timeoutMs?: number;
};

// Backwards-compatible alias expected by other modules
export type GeminiConfig = GeminiClientOptions;

export class GeminiClient {
  private apiKey: string;
  private model: string;
  private timeoutMs: number;

  constructor(opts: GeminiClientOptions) {
    if (!opts?.apiKey) throw new Error('GEMINI_API_KEY missing');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? 'models/gemini-2.5-flash-lite';
    this.timeoutMs = opts.timeoutMs ?? 20000;
  }

  async getRecommendations(prompt: string): Promise<CareerRecommendation[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/${encodeURI(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const body = {
      contents: [
        { role: 'user', parts: [{ text: this.buildJsonOnlyPrompt(prompt) }] }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    } as any;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);

    let resText: string;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal as any
      });

      resText = await res.text();
      if (!res.ok) {
        throw new Error(`Gemini HTTP ${res.status}: ${truncate(resText, 1200)}`);
      }
    } finally {
      clearTimeout(id);
    }

    // Try to parse top-level JSON
    let parsed: any = null;
    try { parsed = JSON.parse(resText); } catch { parsed = null; }

    // Extract textual payload from common response shapes
    let textPayload = '';
    if (parsed) {
      const candidate = parsed.candidates?.[0];
      if (candidate) {
        textPayload = candidate.content?.parts?.[0]?.text ?? (Array.isArray(candidate.content?.parts) ? candidate.content.parts.map((p: any) => p?.text).filter(Boolean).join('') : '') ?? '';
      }

      if (!textPayload && Array.isArray(parsed.output) && parsed.output[0]?.content) {
        const content = parsed.output[0].content;
        if (Array.isArray(content)) textPayload = content.map((c: any) => c.text || '').join('');
        else if (typeof content === 'string') textPayload = content;
      }
    }

    if (!textPayload) textPayload = resText;

    const json = this.coerceToJsonObject(textPayload);

    if (!json || !Array.isArray((json as any).recommendations)) {
      throw new Error(`Gemini returned invalid JSON shape: missing recommendations (preview=${truncate(textPayload, 400)})`);
    }

    const recs = (json as any).recommendations as any[];

    const errors: Array<{ index: number; errors: string[] }> = [];
    for (let i = 0; i < recs.length; i++) {
      const ok = CareerRecommendationValidator.validateCareerRecommendation(recs[i]);
      if (!ok) {
        const missing: string[] = [];
        const required = ['id', 'title', 'description', 'nepAlignment', 'matchScore', 'requirements', 'prospects'];
        for (const f of required) if (!recs[i][f]) missing.push(`missing:${f}`);
        errors.push({ index: i, errors: missing });
      }
    }

    if (errors.length) {
      const err = new Error('Gemini returned invalid recommendation items: ' + JSON.stringify(errors));
      (err as any).details = { errors, raw: json };
      throw err;
    }

    return recs as CareerRecommendation[];
  }

  private buildJsonOnlyPrompt(userPrompt: string): string {
    return [
      'You are an API that returns STRICT JSON with no markdown, no prose.',
      'Respond with an object containing a "recommendations" array that matches the application schema.',
      'Do NOT include explanations.',
      '',
      'User prompt:',
      userPrompt
    ].join('\n');
  }

  private coerceToJsonObject(s: string): unknown {
    try { return JSON.parse(s); } catch {}
    const m = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (m && m[1]) {
      try { return JSON.parse(m[1]); } catch {}
    }
    throw new Error(`Gemini returned non-JSON or unparsable JSON payload: ${truncate(s, 1200)}`);
  }
}

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…(truncated)' : s; }

