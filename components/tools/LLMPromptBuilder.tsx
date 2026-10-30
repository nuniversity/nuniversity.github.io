'use client'

import React, { useState } from 'react';
import { Brain, Copy, Download, RotateCcw, Sparkles, Check } from 'lucide-react';
import { usePersistentState, useCopyToClipboard } from '@/lib/tools/use-persistent-state';
import { downloadText } from '@/lib/tools/download';
import { ToolHeader } from './shared/ToolHeader';

interface LLMPromptBuilderProps {
  lang: string;
  dict: any;
}

interface PromptForm {
  role: string;
  objective: string;
  context: string;
  target: string;
  constraints: string;
  outputFormat: string;
  tone: string;
  examples: string;
}

interface PromptState {
  form: PromptForm;
  generated: string;
}

const EMPTY_FORM: PromptForm = {
  role: '',
  objective: '',
  context: '',
  target: '',
  constraints: '',
  outputFormat: '',
  tone: '',
  examples: '',
};

function validateState(raw: unknown): PromptState | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PromptState>;
  const form = value.form && typeof value.form === 'object' ? value.form : {};
  const read = (key: keyof PromptForm) =>
    typeof (form as Record<string, unknown>)[key] === 'string' ? ((form as Record<string, unknown>)[key] as string) : '';
  return {
    form: {
      role: read('role'),
      objective: read('objective'),
      context: read('context'),
      target: read('target'),
      constraints: read('constraints'),
      outputFormat: read('outputFormat'),
      tone: read('tone'),
      examples: read('examples'),
    },
    generated: typeof value.generated === 'string' ? value.generated : '',
  };
}

const LLMPromptBuilder = ({ dict = {} }: LLMPromptBuilderProps) => {
  const t = dict.tools?.promptBuilder || {};
  const [state, setState, hydrated] = usePersistentState<PromptState>(
    'mimir:tools:llm_prompt_builder',
    { form: EMPTY_FORM, generated: '' },
    validateState
  );
  const { copied, failed, copy } = useCopyToClipboard();
  const [copyAttempted, setCopyAttempted] = useState(false);

  const toneOptions = [
    { value: '', label: t.tones?.none || 'Not specified' },
    { value: 'professional', label: t.tones?.professional || 'Professional' },
    { value: 'casual', label: t.tones?.casual || 'Casual' },
    { value: 'technical', label: t.tones?.technical || 'Technical' },
    { value: 'creative', label: t.tones?.creative || 'Creative' },
    { value: 'educational', label: t.tones?.educational || 'Educational' },
  ];

  const updateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setState((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));
  };

  const buildPrompt = () => {
    const form = state.form;
    let prompt = '';

    if (form.role) prompt += `${t.promptTemplate?.rolePrefix || 'You are'} ${form.role}.\n\n`;
    if (form.objective) prompt += `**${t.labels?.objective || 'Objective'}:**\n${form.objective}\n\n`;
    if (form.context) prompt += `**${t.labels?.context || 'Context'}:**\n${form.context}\n\n`;
    if (form.target) prompt += `**${t.labels?.targetAudience || 'Target Audience'}:**\n${form.target}\n\n`;
    if (form.constraints) prompt += `**${t.labels?.constraints || 'Constraints'}:**\n${form.constraints}\n\n`;
    if (form.outputFormat) prompt += `**${t.labels?.outputFormat || 'Output Format'}:**\n${form.outputFormat}\n\n`;
    if (form.tone) {
      const toneName = toneOptions.find((option) => option.value === form.tone)?.label || form.tone;
      prompt += `**${t.labels?.tone || 'Tone'}:**\n${toneName}\n\n`;
    }
    if (form.examples) prompt += `**${t.labels?.examples || 'Examples'}:**\n${form.examples}\n\n`;

    prompt += t.promptTemplate?.closingText || 'Please provide a comprehensive response following the guidelines above.';
    setState((prev) => ({ ...prev, generated: prompt }));
  };

  const copyPrompt = async () => {
    setCopyAttempted(true);
    await copy(state.generated);
  };

  const downloadPrompt = () => {
    downloadText(state.generated, 'llm-prompt.txt');
  };

  const resetForm = () => {
    setState({ form: EMPTY_FORM, generated: '' });
    setCopyAttempted(false);
  };

  const fields: Array<{
    name: keyof PromptForm;
    label: string;
    placeholder: string;
    multiline?: boolean;
    rows?: number;
    required?: boolean;
  }> = [
    {
      name: 'role',
      label: t.fields?.role?.label || 'Agent Role',
      placeholder: t.fields?.role?.placeholder || 'e.g., an expert Python developer, a creative writer',
    },
    {
      name: 'objective',
      label: t.fields?.objective?.label || 'Objective',
      placeholder: t.fields?.objective?.placeholder || 'What do you want the AI to do?',
      multiline: true,
      rows: 3,
      required: true,
    },
    {
      name: 'context',
      label: t.fields?.context?.label || 'Context',
      placeholder: t.fields?.context?.placeholder || 'Provide background information or situation',
      multiline: true,
      rows: 3,
    },
    {
      name: 'target',
      label: t.fields?.targetAudience?.label || 'Target Audience',
      placeholder: t.fields?.targetAudience?.placeholder || 'e.g., beginners, experts, students',
    },
    {
      name: 'constraints',
      label: t.fields?.constraints?.label || 'Constraints',
      placeholder: t.fields?.constraints?.placeholder || 'e.g., Keep it under 500 words, avoid jargon',
      multiline: true,
      rows: 2,
    },
    {
      name: 'outputFormat',
      label: t.fields?.outputFormat?.label || 'Output Format',
      placeholder: t.fields?.outputFormat?.placeholder || 'e.g., JSON, bullet points, step-by-step guide',
    },
    {
      name: 'examples',
      label: t.fields?.examples?.label || 'Examples',
      placeholder: t.fields?.examples?.placeholder || 'Provide examples of desired output',
      multiline: true,
      rows: 3,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <ToolHeader
          icon={Brain}
          title={t.title || 'LLM Prompt Builder'}
          subtitle={t.subtitle || 'Create structured, effective prompts for Large Language Models'}
          variant="brand"
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-2xl font-semibold">{t.buildYourPrompt || 'Build Your Prompt'}</h2>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={`prompt-${field.name}`} className="block text-sm font-medium mb-2">
                    {field.label}
                    {field.required ? (
                      <span className="text-red-500 ml-1 text-xs" aria-hidden="true">
                        *
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs ml-2">
                        {t.optional || '(Optional)'}
                      </span>
                    )}
                  </label>
                  {field.multiline ? (
                    <textarea
                      id={`prompt-${field.name}`}
                      name={field.name}
                      value={state.form[field.name]}
                      onChange={updateField}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      aria-required={field.required || undefined}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    />
                  ) : (
                    <input
                      id={`prompt-${field.name}`}
                      type="text"
                      name={field.name}
                      value={state.form[field.name]}
                      onChange={updateField}
                      placeholder={field.placeholder}
                      aria-required={field.required || undefined}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  )}
                </div>
              ))}

              <div>
                <label htmlFor="prompt-tone" className="block text-sm font-medium mb-2">
                  {t.fields?.tone?.label || 'Tone'}
                </label>
                <select
                  id="prompt-tone"
                  name="tone"
                  value={state.form.tone}
                  onChange={updateField}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={buildPrompt}
                  disabled={!state.form.objective.trim()}
                  className="flex-1 bg-brand text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.buttons?.generate || 'Generate Prompt'}
                </button>
                <button
                  onClick={resetForm}
                  aria-label={tcReset(t)}
                  className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-all"
                >
                  <RotateCcw className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{t.generatedPrompt || 'Generated Prompt'}</h2>
              {state.generated && (
                <div className="flex gap-2">
                  <button
                    onClick={copyPrompt}
                    aria-label={t.buttons?.copy || 'Copy to clipboard'}
                    className="p-2 rounded-lg hover:bg-muted transition-all"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                    ) : (
                      <Copy className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    onClick={downloadPrompt}
                    aria-label={t.buttons?.download || 'Download as .txt'}
                    className="p-2 rounded-lg hover:bg-muted transition-all"
                  >
                    <Download className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {state.generated ? (
              <div
                className="bg-muted/50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap min-h-[320px] lg:h-[calc(100vh-280px)] overflow-y-auto border border-border"
                aria-live="polite"
              >
                {state.generated}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[320px] lg:h-[calc(100vh-280px)] text-muted-foreground">
                <Brain className="w-16 h-16 mb-4 opacity-50" aria-hidden="true" />
                <p className="text-center">
                  {t.emptyState?.line1 || 'Fill in the form and click "Generate Prompt"'}
                  <br />
                  {t.emptyState?.line2 || 'to see your structured prompt here'}
                </p>
              </div>
            )}

            {copyAttempted && failed && (
              <p className="mt-2 text-sm text-red-500">
                {t.copy_failed || 'Could not copy automatically — select the text and copy it manually.'}
              </p>
            )}

            {state.generated && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>{t.tip?.label || 'Tip'}:</strong>{' '}
                  {t.tip?.text ||
                    'Copy this prompt and paste it into your favorite LLM (ChatGPT, Claude, Gemini, etc.) for best results.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">{t.tipsSection?.title || 'Tips for Effective Prompts'}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: t.tipsSection?.tip1?.title || 'Be Specific', text: t.tipsSection?.tip1?.text || 'Clearly define what you want. The more specific your objective, the better the results.' },
              { title: t.tipsSection?.tip2?.title || 'Provide Context', text: t.tipsSection?.tip2?.text || 'Background information helps the AI understand your needs and generate more relevant responses.' },
              { title: t.tipsSection?.tip3?.title || 'Use Examples', text: t.tipsSection?.tip3?.text || 'Show examples of the desired output format to guide the AI response structure.' },
            ].map((tip) => (
              <div key={tip.title}>
                <h3 className="font-medium text-primary mb-2">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function tcReset(t: any): string {
  return t.buttons?.reset || 'Reset form';
}

export default LLMPromptBuilder;
