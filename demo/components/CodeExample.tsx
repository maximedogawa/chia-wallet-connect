interface CodeExampleProps {
  title: string;
  code: string;
  language?: string;
}

/**
 * Reusable code example component with syntax highlighting support
 */
export default function CodeExample({ title, code, language = 'typescript' }: CodeExampleProps) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h2>
      <pre className="text-xs bg-gray-100 dark:bg-zinc-900 p-3 rounded overflow-x-auto">
        <code className={language}>{code}</code>
      </pre>
    </div>
  );
}
