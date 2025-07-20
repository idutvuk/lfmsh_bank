import { useState, useEffect } from "react"
import { Background } from "@/components/Background"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/Navbar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import rehypeHighlight from "rehype-highlight"
import { loadMarkdownContent, processMarkdown, extractAccordionSections } from "@/lib/markdown-loader"
import { MarkdownComponents, MarkdownAccordion } from "@/lib/markdown-components"

export default function RulesPage() {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [accordionSections, setAccordionSections] = useState<Record<string, string>>({});
  
  // Load markdown content
  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      try {
        const content = await loadMarkdownContent("/rules.md");
        setMarkdownContent(processMarkdown(content));
        setAccordionSections(extractAccordionSections(content));
      } catch (error) {
        console.error("Failed to load rules content:", error);
        setMarkdownContent("# Ошибка загрузки\n\nНе удалось загрузить правила. Пожалуйста, попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, []);
  
  // Filter content based on search term
  const filteredContent = searchTerm 
    ? markdownContent.split('\n')
        .filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
        .join('\n')
    : markdownContent;

  // Handle search input
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <Background>
      {/* Header */}
      <Navbar 
        showBackButton={true}
        title="Правила"
        showSearch={true}
      />

      <div className="w-full max-w-screen-xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="prose max-w-none dark:prose-invert">
                {/* Regular markdown content */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                  components={MarkdownComponents}
                >
                  {filteredContent}
                </ReactMarkdown>
                
                {/* Special accordion sections if we're not filtering */}
                {!searchTerm && Object.keys(accordionSections).length > 0 && (
                  <div className="mt-6">
                    <MarkdownAccordion>
                      {Object.entries(accordionSections).map(([id, content]) => (
                        <AccordionItem value={id} key={id}>
                          <AccordionTrigger className="text-lg">
                            {markdownContent.match(new RegExp(`## (.+?) {#${id}}`))![1]}
                          </AccordionTrigger>
                          <AccordionContent>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                              {content}
                            </ReactMarkdown>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </MarkdownAccordion>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Background>
  )
} 