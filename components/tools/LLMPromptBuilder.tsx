'use client'

import React, { useState } from 'react';
import { Brain, Copy, Download, RotateCcw, Sparkles, Check } from 'lucide-react';

interface LLMPromptBuilderProps {
  lang: string;
  dict: any;
}

const LLMPromptBuilder = ({ lang, dict }: LLMPromptBuilderProps) => {
  const [formData, setFormData] = useState({
    role: '',
    objective: '',
    context: '',
    target: '',
    constraints: '',
    outputFormat: '',
    tone: 'professional',
    examples: '',
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Get translations
  const t = dict.tools?.promptBuilder || {};

  const toneOptions = [
    { value: 'professional', label: t.tones?.professional || 'Professional' },
    { value: 'casual', label: t.tones?.casual || 'Casual' },
    { value: 'technical', label: t.tones?.technical || 'Technical' },
    { value: 'creative', label: t.tones?.creative || 'Creative' },
    { value: 'educational', label: t.tones?.educational || 'Educational' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const buildPrompt = () => {
    let prompt = '';

    if (formData.role) {
      prompt += `${t.promptTemplate?.rolePrefix || 'You are'} ${formData.role}.\n\n`;
    }

    if (formData.objective) {
      prompt += `**${t.labels?.objective || 'Objective'}:**\n${formData.objective}\n\n`;
    }

    if (formData.context) {
      prompt += `**${t.labels?.context || 'Context'}:**\n${formData.context}\n\n`;
    }

    if (formData.target) {
      prompt += `**${t.labels?.targetAudience || 'Target Audience'}:**\n${formData.target}\n\n`;
    }

    if (formData.constraints) {
      prompt += `**${t.labels?.constraints || 'Constraints'}:**\n${formData.constraints}\n\n`;
    }

    if (formData.outputFormat) {
      prompt += `**${t.labels?.outputFormat || 'Output Format'}:**\n${formData.outputFormat}\n\n`;
    }

    if (formData.tone) {
      const toneName = toneOptions.find(opt => opt.value === formData.tone)?.label || formData.tone;
      prompt += `**${t.labels?.tone || 'Tone'}:**\n${toneName}\n\n`;
    }

    if (formData.examples) {
      prompt += `**${t.labels?.examples || 'Examples'}:**\n${formData.examples}\n\n`;
    }

    prompt += t.promptTemplate?.closingText || 'Please provide a comprehensive response following the guidelines above.';

    setGeneratedPrompt(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm-prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      role: '',
      objective: '',
      context: '',
      target: '',
      constraints: '',
      outputFormat: '',
      tone: 'professional',
      examples: '',
    });
    setGeneratedPrompt('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.title || 'LLM Prompt Builder'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.subtitle || 'Create structured, effective prompts for Large Language Models'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-2xl font-semibold">{t.buildYourPrompt || 'Build Your Prompt'}</h2>
            </div>

            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.role?.label || 'Agent Role'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder={t.fields?.role?.placeholder || 'e.g., an expert Python developer, a creative writer'}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.objective?.label || 'Objective'} *
                  <span className="text-red-500 ml-1">{t.required || 'Required'}</span>
                </label>
                <textarea
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  placeholder={t.fields?.objective?.placeholder || 'What do you want the AI to do?'}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Context */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.context?.label || 'Context'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <textarea
                  name="context"
                  value={formData.context}
                  onChange={handleChange}
                  placeholder={t.fields?.context?.placeholder || 'Provide background information or situation'}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.targetAudience?.label || 'Target Audience'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <input
                  type="text"
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  placeholder={t.fields?.targetAudience?.placeholder || 'e.g., beginners, experts, students'}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.tone?.label || 'Tone'}
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {toneOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Constraints */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.constraints?.label || 'Constraints'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <textarea
                  name="constraints"
                  value={formData.constraints}
                  onChange={handleChange}
                  placeholder={t.fields?.constraints?.placeholder || 'e.g., Keep it under 500 words, avoid jargon'}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.outputFormat?.label || 'Output Format'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <input
                  type="text"
                  name="outputFormat"
                  value={formData.outputFormat}
                  onChange={handleChange}
                  placeholder={t.fields?.outputFormat?.placeholder || 'e.g., JSON, bullet points, step-by-step guide'}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Examples */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.fields?.examples?.label || 'Examples'}
                  <span className="text-gray-500 text-xs ml-2">{t.optional || '(Optional)'}</span>
                </label>
                <textarea
                  name="examples"
                  value={formData.examples}
                  onChange={handleChange}
                  placeholder={t.fields?.examples?.placeholder || 'Provide examples of desired output'}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={buildPrompt}
                  disabled={!formData.objective}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.buttons?.generate || 'Generate Prompt'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Output Display */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{t.generatedPrompt || 'Generated Prompt'}</h2>
              {generatedPrompt && (
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title={t.buttons?.copy || 'Copy to clipboard'}
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={downloadPrompt}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title={t.buttons?.download || 'Download as .txt'}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {generatedPrompt ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap h-[calc(100vh-280px)] overflow-y-auto border border-gray-200 dark:border-gray-700">
                {generatedPrompt}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-280px)] text-gray-400">
                <Brain className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">
                  {t.emptyState?.line1 || 'Fill in the form and click "Generate Prompt"'}<br />
                  {t.emptyState?.line2 || 'to see your structured prompt here'}
                </p>
              </div>
            )}

            {generatedPrompt && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>{t.tip?.label || 'Tip'}:</strong> {t.tip?.text || 'Copy this prompt and paste it into your favorite LLM (ChatGPT, Claude, Gemini, etc.) for best results.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold mb-4">{t.tipsSection?.title || 'Tips for Effective Prompts'}</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-purple-600 mb-2">{t.tipsSection?.tip1?.title || 'Be Specific'}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.tipsSection?.tip1?.text || 'Clearly define what you want. The more specific your objective, the better the results.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">{t.tipsSection?.tip2?.title || 'Provide Context'}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.tipsSection?.tip2?.text || 'Background information helps the AI understand your needs and generate more relevant responses.'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">{t.tipsSection?.tip3?.title || 'Use Examples'}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.tipsSection?.tip3?.text || 'Show examples of the desired output format to guide the AI response structure.'}
              </p>
            </div>
            {/* <div>
              <h4 className="font-medium text-purple-600 mb-2">{t.tipsSection?.tip4?.title || 'Use Examples'}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.tipsSection?.tip4?.text || 'Show examples of the desired output format to guide the AI response structure.'}
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMPromptBuilder;