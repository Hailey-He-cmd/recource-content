import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Plus, Trash2, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { BASE_TEMPLATE, STOCK_FEATURES_TEMPLATE, DEFAULT_FEATURES_TEMPLATE, AI_PROMPTS_BASE_TEMPLATE } from './template';
import { STEP_TEMPLATES } from './stepTemplates';
import InternalLinkLibrary, { InternalLink } from './InternalLinkLibrary';

export const extractFeatureImagePrompt = (htmlCode: string, keyword: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const featureSection = doc.querySelector('.part-features');
    if (!featureSection) return '';

    const rows = featureSection.querySelectorAll('.row');
    if (!rows || rows.length === 0) return '';

    const kebabKeyword = keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    let promptText = `请你针对下面这${rows.length}段文案，生成相关文案主题的图片，图片大小为1035*630， 图片命名为${kebabKeyword}-1，${kebabKeyword}-2，（也就是主题关键词短横线隔开+序号命名，顺序从1-${rows.length}）以此类推：\n`;

    rows.forEach((row, index) => {
      promptText += `\n文案${index + 1}：\n`;
      
      const h3Text = row.querySelector('h3')?.textContent?.trim();
      if (h3Text) promptText += `${h3Text}\n`;

      const p = row.querySelector('p');
      if (p) {
        promptText += `${p.textContent?.trim()}\n`;
      }

      const lis = row.querySelectorAll('ul.desc-list li');
      if (lis && lis.length > 0) {
        lis.forEach(li => {
          promptText += `${li.textContent?.trim().replace(/\s+/g, ' ')}\n`;
        });
      }
    });

    return promptText.trim();
  } catch (e) {
    console.error('Failed to parse HTML for feature prompts:', e);
    return '';
  }
};

export default function App() {
  const [keyword, setKeyword] = useState('');
  const [keywordSequence, setKeywordSequence] = useState('');
  const [resourceCount, setResourceCount] = useState('');
  const [directoryLinks, setDirectoryLinks] = useState<{url: string}[]>(() => {
    const saved = localStorage.getItem('directoryLinks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse directory links from local storage', e);
      }
    }
    return [{ url: '' }];
  });
  const [bulkDirectoryLinks, setBulkDirectoryLinks] = useState(() => {
    return localStorage.getItem('bulkDirectoryLinks') || '';
  });
  const [directoryInputMode, setDirectoryInputMode] = useState<'individual' | 'bulk'>(() => {
    const saved = localStorage.getItem('directoryInputMode');
    return (saved === 'individual' || saved === 'bulk') ? saved : 'individual';
  });
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>(() => {
    const saved = localStorage.getItem('internalLinks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse internal links from local storage', e);
      }
    }
    return [];
  });
  const [stepType, setStepType] = useState<keyof typeof STEP_TEMPLATES>('aiprompts');
  const [targetLanguage, setTargetLanguage] = useState('English');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; metaDescription: string; url: string; htmlCode: string; jsonLd: string; featureImagePrompt?: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'title' | 'meta' | 'url' | 'html' | 'jsonLd' | 'featureImage' | null>(null);

  React.useEffect(() => {
    localStorage.setItem('internalLinks', JSON.stringify(internalLinks));
  }, [internalLinks]);

  React.useEffect(() => {
    localStorage.setItem('directoryLinks', JSON.stringify(directoryLinks));
  }, [directoryLinks]);

  React.useEffect(() => {
    localStorage.setItem('bulkDirectoryLinks', bulkDirectoryLinks);
  }, [bulkDirectoryLinks]);

  React.useEffect(() => {
    localStorage.setItem('directoryInputMode', directoryInputMode);
  }, [directoryInputMode]);

  const handleAddDirectoryLink = () => {
    setDirectoryLinks([...directoryLinks, { url: '' }]);
  };

  const handleRemoveDirectoryLink = (index: number) => {
    const newLinks = [...directoryLinks];
    newLinks.splice(index, 1);
    setDirectoryLinks(newLinks);
  };

  const handleDirectoryLinkChange = (index: number, value: string) => {
    const newLinks = [...directoryLinks];
    newLinks[index].url = value;
    setDirectoryLinks(newLinks);
  };

  const handleCopy = (type: 'title' | 'meta' | 'url' | 'html' | 'jsonLd' | 'featureImage', text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    if (!keyword) {
      setError('请填写必填项：主题资源关键词。');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const finalDirectoryLinks = directoryInputMode === 'bulk'
        ? bulkDirectoryLinks.split('\n').map(url => url.trim()).filter(Boolean)
        : directoryLinks.map(l => l.url).filter(Boolean);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const isStockKeyword = keyword.toLowerCase().includes('stock');
      let finalBaseTemplate = '';
      if (stepType === 'aiprompts') {
        finalBaseTemplate = AI_PROMPTS_BASE_TEMPLATE;
      } else {
        const featuresTemplate = isStockKeyword ? STOCK_FEATURES_TEMPLATE : DEFAULT_FEATURES_TEMPLATE;
        finalBaseTemplate = BASE_TEMPLATE.replace('<!-- FEATURES_SECTION_PLACEHOLDER -->', featuresTemplate);
      }
      
      const prompt = `
You are an expert SEO content creator and web developer.
I will provide you with a base HTML template, a target keyword, a keyword sequence, a resource count, a list of anchor links, and a selected HTML code block for the "Steps" section.

Your task is to:
1. Generate a highly attractive and click-worthy SEO Title (max 70 characters) in ${targetLanguage}. It MUST include the resource count, the target keyword, and relate to the specific use-case/scenario of the keyword to drive clicks (e.g., "for Cinematic Edits", "to Boost Engagement"). If the target language is English, the title MUST follow APA Title Case format. The title MUST include "Filmora" or end with " | Filmora".
2. Generate an SEO Meta Description (max 200 characters) in ${targetLanguage} that includes the core keyword.
3. Generate a URL path based on the target keyword in the format: ${stepType === 'aiprompts' ? '/ai-prompt/' : '/templates/'}your-kebab-case-keyword.html (e.g., if keyword is "multi color text", url is "${stepType === 'aiprompts' ? '/ai-prompt/' : '/templates/'}multi-color-text.html").
4. Rewrite the text content within the provided base HTML template to focus on the new target keyword. 
   - CRITICAL LANGUAGE RULE: Absolutely ALL text content generated by you MUST be strictly in ${targetLanguage} AND ONLY IN ${targetLanguage} (except for HTML code attributes). This means you MUST TRANSLATE all default English text found in the base template into ${targetLanguage}! This includes CTA buttons (e.g., "Start Creating Now", "Edit Your Memories"), headings, labels, menu items, bullet points, FAQ questions and answers, and modal text. Do NOT leave any English text in the user-facing content unless it is a globally recognized brand name (like "Filmora", "TikTok", "Instagram", "Gemini", "ChatGPT"). CRITICAL: DO NOT add English explanations or original English terms in parentheses (e.g., DO NOT write "動画編集 (Video Editing)"). You MUST write natively in ${targetLanguage} without any English annotations. You MUST use standard punctuation marks appropriate for ${targetLanguage}. Do NOT use Chinese punctuation unless the target language is Chinese.
   - CRITICAL: Be highly creative and completely rewrite the descriptions, paragraphs, and headings to be deeply relevant to the target keyword. All descriptive text throughout the page MUST be highly engaging, directly address user needs within the context of video editing, hit the user's pain points or desires, and be highly attractive. Do NOT just swap out the keyword in the boilerplate text. The content must be unique, engaging, and offer fresh perspectives tailored to the specific topic.${stepType === 'aiprompts' ? ' The content MUST specifically match the search intent of the keyword on social media platforms, including appropriate emojis throughout the text.' : ''}
   - CRITICAL FOR "part-features" SECTION: The base template has ${stepType === 'aiprompts' ? '4' : '3'} feature modules. DO NOT just paraphrase these concepts. You MUST invent ${stepType === 'aiprompts' ? '4' : '3'} COMPLETELY NEW feature concepts, selling points, and bullet points that make sense for the new target keyword. Change the emojis, change the bullet point topics, and change the core message. The original text is ONLY a structural layout reference. All generated text in this section MUST be purely in ${targetLanguage} without any bracketed English translation. You MUST PRESERVE the image/video 'src' attributes exactly as they are in the template, but you MUST UPDATE the 'alt' attributes of these images to be highly relevant to the new target keyword and strictly in ${targetLanguage}.
   - CRITICAL FOR "part-faq" SECTION: The base template includes a 5-question FAQ section. You MUST generate 5 completely unique, highly relevant questions and detailed answers specifically tailored to the target keyword. Do NOT use generic questions. The Q&A must provide real value and address actual user intents related to the specific topic.
   - CRITICAL CAPITALIZATION RULE (ENGLISH ONLY): IF the target language is English, all headings (h1, h2, h3, h4, h5, h6) and Call-to-Action (CTA) button texts MUST strictly follow APA Title Case formatting. For body text, if the provided keyword sequence contains capitalized words, do NOT capitalize them unless they appear at the beginning of a sentence or are proper nouns. Force them to lowercase in the middle of sentences. For non-English languages, follow their native capitalization and grammar rules.
   - CRITICAL FOR CTA BUTTONS: Do NOT use bold tags (<b> or <strong>) inside the text of Call-to-Action (CTA) buttons. All CTA button texts MUST be translated into ${targetLanguage}.
${stepType === 'aiprompts' ? '' : `   - CRITICAL FOR "part-more" SECTION: The base template includes a "part-more" section with a heading, a descriptive paragraph, and a grid of 8 related AI prompt tools. You MUST rewrite the \`<h2>\` heading and the \`<p>\` description above the grid to be highly engaging, directly addressing user needs within the video editing context of the target keyword. The descriptive text must be attractive and hit the user's pain points or desires. DO NOT change the HTML structure or the content of the 8 boxes in the grid (keep the \`row\` and \`col\` items exactly as they are).`}
   - CRITICAL FOR "part-templates" SECTION: The base template includes a "category-wrapper" with a swiper menu. You MUST keep the currently active item as the active item for the current page, and update its text in ${targetLanguage} to match the new target keyword (max 2 words). If "Directory Links" are provided in the inputs, you MUST add new \`<div class="swiper-slide">\` items to the RIGHT of the active item (i.e., immediately after it). For each provided URL, create a new \`<a>\` tag with the \`href\` attribute set to that URL, and generate exactly two words in ${targetLanguage} for its text that logically reflect the theme of that specific URL. These new items MUST NOT have the \`active\` class. CRITICAL: You MUST also find and completely rewrite the loading text ("Loading more plain text examples...") and the load more CTA button texts ("Load More Plain Text Guides") at the bottom of this section to be highly relevant to the new target keyword in ${targetLanguage}. Do NOT leave them as "plain text" or "examples/guides" unless appropriately translated to ${targetLanguage} and relevant to the keyword.
${stepType === 'aiprompts' ? '   - CRITICAL FOR "templateModal" SECTION: The base template includes a modal with id="templateModal". You MUST rewrite the text inside this modal to match the new target keyword. Specifically, update the `<h3>` title, the "Copy this prompt to generate..." description label, the three download button texts, and the "Similar ... AI Guides" title to reflect the new keyword AND ensure they are entirely translated into ${targetLanguage}.' : ''}
   - Keep the HTML structure, classes, and tags exactly the same, only change the text (headings, paragraphs, button texts, etc.) to match the new topic.
   - If a Keyword Sequence is provided, naturally integrate these keywords into the text content to increase keyword density.
5. Replace the <!-- STEP_SECTION_PLACEHOLDER --> in the base template with the provided "Selected Steps HTML Template". You MUST rewrite the text inside this steps HTML in ${targetLanguage} to match the new keyword and integrate the keyword sequence. You MUST PRESERVE the image 'src' and 'alt' attributes exactly as they are in the template. You MUST also include context-appropriate emojis in the text content of the steps section.
6. Naturally insert the provided Internal Links into the text content. IMPORTANT: If the provided Anchor Text is in English but the target language is NOT English, you MUST translate the Anchor Text into ${targetLanguage} so that it integrates seamlessly and naturally into the sentence. DO NOT leave the anchor text in English, and DO NOT add English explanations in parentheses. The HTML format for the internal links MUST be exactly like this: <a href="[URL]" class="text-secondary" target="_blank"><u>[Translated Anchor Text]</u></a>
9. CRITICAL: The output HTML code MUST be properly formatted and pretty-printed with correct indentation and line breaks. Do NOT minify the HTML.
10. Generate JSON-LD structured data including BreadcrumbList and SoftwareApplication schemas. The content (name, description) MUST be completely translated into ${targetLanguage}. Use the following format as a template:
\`\`\`html
<!-- Breadcrumb JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Filmora",
      "item": "https://filmora.wondershare.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "[TRANSLATE '${stepType === 'aiprompts' ? 'AI Prompts' : 'Templates'}' INTO ${targetLanguage}]",
      "item": "https://filmora.wondershare.com/${stepType === 'aiprompts' ? 'ai-prompt' : 'templates'}/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[TARGET KEYWORD IN ${targetLanguage}]",
      "item": "https://filmora.wondershare.com/${stepType === 'aiprompts' ? 'ai-prompt' : 'templates'}/[KEBAB-CASE-KEYWORD].html"
    }
  ]
}
</script>

<!-- SoftwareApplication / Product JSON-LD -->
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "SoftwareApplication",
  "name": "[TARGET KEYWORD IN ${targetLanguage}]",
  "image": "https://static-alisz-rs.wondershare.cn/third/s5/61639a63f78f4a3c78a842fbb7d68e91.jpg",
  "description": "[Generate a relevant description in ${targetLanguage} including the resource count and keyword]",
  "operatingSystem": "Windows, macOS, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "59.99",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "152456"
  }
}
</script>
\`\`\`

Inputs:
- Target Keyword: ${keyword}
- Keyword Sequence: ${keywordSequence || 'None'}
- Resource Count: ${resourceCount}
- Directory Links: ${JSON.stringify(finalDirectoryLinks)}
- Internal Links: ${JSON.stringify(internalLinks.filter(link => link.active && link.anchor && link.url).map(l => ({ text: l.anchor, url: l.url })))}
- Selected Steps HTML Template: 
\`\`\`html
${STEP_TEMPLATES[stepType]}
\`\`\`

Base HTML Template:
\`\`\`html
${finalBaseTemplate}
\`\`\`

Return the output as a JSON object with 'title', 'metaDescription', 'url', 'htmlCode', and 'jsonLd'.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "SEO Title in APA format, max 70 chars, includes resource count" },
              metaDescription: { type: Type.STRING, description: "Meta description, max 200 chars, includes keyword" },
              url: { type: Type.STRING, description: "Generated URL path, e.g., /templates/kebab-case-keyword.html" },
              htmlCode: { type: Type.STRING, description: "The complete modified HTML code, properly formatted with indentation and line breaks" },
              jsonLd: { type: Type.STRING, description: "The generated JSON-LD structured data code" }
            },
            required: ["title", "metaDescription", "url", "htmlCode", "jsonLd"]
          }
        }
      });
      
      if (response.text) {
        const data = JSON.parse(response.text);
        const featureImagePrompt = extractFeatureImagePrompt(data.htmlCode, keyword);
        setResult({ ...data, featureImagePrompt });
      } else {
        throw new Error('No response from AI');
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            Filmora 资源页上线工具
          </h1>
          <p className="text-slate-600 mt-2">输入关键词和步骤代码，一键生成符合主题情境的SEO资源页正文代码，适合上线端内资源以及AI Prompt特效页。</p>
        </header>

        <InternalLinkLibrary links={internalLinks} setLinks={setInternalLinks} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Inputs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-100 pb-4">输入配置</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                目标市场语言 (Target Market Language) <span className="text-red-500">*</span>
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="English">English</option>
                <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                <option value="Chinese (Traditional)">Chinese (Traditional)</option>
                <option value="German">German</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
                <option value="Russian">Russian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                主题资源关键词 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="例如：Video Transitions"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                关键词序列 (选填)
              </label>
              <input
                type="text"
                value={keywordSequence}
                onChange={(e) => setKeywordSequence(e.target.value)}
                placeholder="例如：text effects, video editing, title animation"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">输入多个关键词以逗号分隔，AI 会将其自然融入正文中以增加关键词密度。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                资源数
              </label>
              <input
                type="text"
                value={resourceCount}
                onChange={(e) => setResourceCount(e.target.value)}
                placeholder="例如：140+"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  资源展示板块目录跳转链接 (选填)
                </label>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setDirectoryInputMode('individual')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${directoryInputMode === 'individual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    逐个添加
                  </button>
                  <button
                    onClick={() => setDirectoryInputMode('bulk')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${directoryInputMode === 'bulk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    批量输入
                  </button>
                </div>
              </div>

              {directoryInputMode === 'individual' ? (
                <>
                  <div className="space-y-3">
                    {directoryLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleDirectoryLinkChange(index, e.target.value)}
                          placeholder="完整 URL (例如：https://...)"
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        <button
                          onClick={() => handleRemoveDirectoryLink(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddDirectoryLink}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> 添加跳转链接
                  </button>
                </>
              ) : (
                <textarea
                  value={bulkDirectoryLinks}
                  onChange={(e) => setBulkDirectoryLinks(e.target.value)}
                  placeholder="请输入完整的 URL，每行一个&#10;例如：&#10;https://filmora.wondershare.com/templates/1.html&#10;https://filmora.wondershare.com/templates/2.html"
                  className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              )}
              <p className="text-xs text-slate-500 mt-2">填入的其他页面 URL 将显示在目录右侧（当前页面仍保持 active 状态），AI 会自动为其生成两个单词的目录名称。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                步骤类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={stepType}
                onChange={(e) => setStepType(e.target.value as keyof typeof STEP_TEMPLATES)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="aiprompts">AI Prompts类</option>
                <option value="title">Title 类</option>
                <option value="transition">Transition 类</option>
                <option value="effect">Effect 类</option>
                <option value="filter">Filter 类</option>
                <option value="sticker">Sticker 类</option>
                <option value="templates">Templates 类</option>
                <option value="stock">Stock 类</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成资源页
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Output */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 h-full">
            <h2 className="text-xl font-semibold text-slate-800 border-b border-slate-100 pb-4">生成结果</h2>
            
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>填写左侧信息并点击生成</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-indigo-500 min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-slate-600">AI 正在努力创作中，请稍候...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      标题 (Title)
                    </label>
                    <button
                      onClick={() => handleCopy('title', result.title)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'title' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    {result.title}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      元描述 (Meta Description)
                    </label>
                    <button
                      onClick={() => handleCopy('meta', result.metaDescription)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'meta' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'meta' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed">
                    {result.metaDescription}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      页面 URL (URL Path)
                    </label>
                    <button
                      onClick={() => handleCopy('url', result.url)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'url' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    {result.url}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      正文代码 (HTML Code)
                    </label>
                    <button
                      onClick={() => handleCopy('html', result.htmlCode)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'html' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'html' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={result.htmlCode}
                    className="flex-1 w-full p-4 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 font-mono text-xs leading-relaxed outline-none resize-none whitespace-pre"
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    💡 提示：资源页三大模块部分的图片视频需要自定义修改~
                  </p>
                </div>

                {result.featureImagePrompt && (
                  <div className="flex-1 flex flex-col min-h-[300px] mt-6 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        功能版块图片自定义 (Feature Image Prompt)
                      </label>
                      <button
                        onClick={() => handleCopy('featureImage', result.featureImagePrompt!)}
                        className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        {copied === 'featureImage' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'featureImage' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={result.featureImagePrompt}
                      className="flex-1 w-full p-4 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 font-mono text-sm leading-relaxed outline-none resize-none whitespace-pre-wrap"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      💡 提示：可以直接复制此 Prompt 发给 AI 结合文案生成相关配图，然后上传进行批量制图~
                    </p>
                  </div>
                )}

                <div className="flex-1 flex flex-col min-h-[300px] mt-6 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">
                      结构化数据 (JSON-LD)
                    </label>
                    <button
                      onClick={() => handleCopy('jsonLd', result.jsonLd)}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      {copied === 'jsonLd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === 'jsonLd' ? '已复制' : '复制'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={result.jsonLd}
                    className="flex-1 w-full p-4 bg-slate-900 text-slate-300 rounded-lg border border-slate-800 font-mono text-xs leading-relaxed outline-none resize-none whitespace-pre"
                  />
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    💡 提示：请记得替换 JSON-LD 中的占位图片 URL~
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
