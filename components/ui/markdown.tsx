import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
  className?: string
}

export default function Markdown({ children, className = "" }: MarkdownProps) {
  return (
    <div className={`prose prose-sm prose-gray max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // 自定义组件样式
        h1: ({ children }) => (
          <h1 className="text-lg font-medium text-gray-900 mb-3 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-medium text-gray-900 mb-2 mt-5 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium text-gray-900 mb-2 mt-4 first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-gray-600 leading-relaxed font-light mb-3 last:mb-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 pl-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 pl-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-gray-600 font-light text-sm leading-relaxed flex items-start">
            <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-gray-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-700">
            {children}
          </em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-gray-200 pl-4 py-2 my-3 bg-gray-50 rounded-r-lg">
            <div className="text-gray-600 font-light italic">
              {children}
            </div>
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className
          
          if (isInline) {
            return (
              <code 
                className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          
          return (
            <code 
              className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="bg-gray-100 rounded-lg p-3 my-3 overflow-x-auto">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 underline hover:text-black transition-colors duration-200"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full border-collapse border border-gray-200">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-900">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
            {children}
          </td>
        ),
        hr: () => (
          <hr className="border-0 border-t border-gray-200 my-4" />
        )
      }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
} 