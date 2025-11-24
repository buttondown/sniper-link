"use client";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "text" }: CodeBlockProps) {
  // Simple syntax highlighting without complex regex
  const highlightCode = (code: string, lang: string) => {
    if (lang === "html") {
      return code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    }

    // For other languages, just return the code as-is for now
    return code;
  };

  const highlightedCode = highlightCode(code, language);

  return (
    <div className="bg-gray-900 p-3 rounded-md text-green-400 font-mono text-sm overflow-x-auto">
      <pre className="whitespace-pre-wrap">
        <code>{highlightedCode}</code>
      </pre>
    </div>
  );
}
