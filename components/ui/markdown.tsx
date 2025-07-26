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
          <h1 className="text-lg font-medium text-primary mb-3 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-medium text-primary mb-2 mt-5 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-medium text-primary mb-2 mt-4 first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-secondary leading-relaxed font-light mb-3 last:mb-0">
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
          <li className="text-secondary font-light text-sm leading-relaxed flex items-start">
            <span className="inline-block w-1 h-1 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-primary">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-secondary">
            {children}
          </em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-default pl-4 py-2 my-3 bg-subtle rounded-r-lg">
            <div className="text-secondary font-light italic">
              {children}
            </div>
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const isInline = !className
          
          if (isInline) {
            return (
              <code 
                className="bg-subtle text-primary px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          
          return (
            <code 
              className="block bg-subtle text-primary p-3 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto"
              {...props}
            >
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <pre className="bg-subtle rounded-lg p-3 my-3 overflow-x-auto">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 transition-colors duration-200"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full border-collapse border border-default">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-default bg-subtle px-3 py-2 text-left text-xs font-medium text-primary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-default px-3 py-2 text-sm text-secondary">
            {children}
          </td>
        ),
        hr: () => (
          <hr className="border-0 border-t border-default my-4" />
        )
      }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
} 