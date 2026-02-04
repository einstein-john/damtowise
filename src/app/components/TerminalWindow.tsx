import React from 'react';

export function TerminalWindow() {
  const code = `interface AutomationEngineer {
  name: string;
  role: "Backend & Automation Engineer";
  stack: string[];
  passions: string[];
}

const engineer: AutomationEngineer = {
  name: "Your Name",
  role: "Backend & Automation Engineer",
  stack: ["TypeScript", "Node.js", "n8n"],
  passions: ["Logic Flows", "API Design", "Automation"]
};

console.log(\`Hello! I'm \${engineer.name}\`);`;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Terminal Header */}
      <div className="bg-[#1a1a1a] rounded-t-lg border border-[#333] border-b-0 p-3 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>
        <div className="flex-1 text-center text-[#999] text-sm font-mono">portfolio.ts</div>
      </div>

      {/* Terminal Body */}
      <div className="bg-[#0a0a0a] rounded-b-lg border border-[#333] p-4 sm:p-6 overflow-x-hidden">
        <pre className="text-xs sm:text-sm leading-relaxed">
          <code className="font-mono">
            {code.split('\n').map((line, index) => (
              <div key={index} className="flex items-start">
                <span className="text-[#666] select-none mr-3 sm:mr-4 text-right inline-block w-6 shrink-0">
                  {index + 1}
                </span>
                <span className="text-[#e0e0e0] min-w-0 whitespace-pre-wrap break-words">
                  {line.includes('interface') || line.includes('const') ? (
                    <>
                      <span className="text-[#ff6600]">
                        {line.match(/^(interface|const)/)?.[0]}
                      </span>
                      {line.replace(/^(interface|const)/, '')}
                    </>
                  ) : line.includes('string') || line.includes('role') || line.includes('name') ? (
                    line.split(/(".*?"|'.*?')/).map((part, i) =>
                      part.match(/["']/) ? (
                        <span key={i} className="text-[#ff8833]">
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )
                  ) : line.includes('console.log') ? (
                    <>
                      <span className="text-[#ff6600]">console</span>
                      {'.'}
                      <span className="text-[#ff6600]">log</span>
                      {line
                        .replace(/console\.log/, '')
                        .split(/(`.*?`)/)
                        .map((part, i) =>
                          part.startsWith('`') ? (
                            <span key={i} className="text-[#ff8833]">
                              {part}
                            </span>
                          ) : (
                            <span key={i}>{part}</span>
                          ),
                        )}
                    </>
                  ) : (
                    line
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
