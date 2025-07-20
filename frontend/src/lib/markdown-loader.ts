/**
 * Utility functions to load markdown content from files
 */

/**
 * Loads markdown content from a specified path
 * @param path Path to the markdown file
 * @returns The markdown content as a string
 */
export async function loadMarkdownContent(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load markdown: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading markdown:', error);
    return '# Error loading content\n\nSorry, there was an error loading the requested content.';
  }
}

/**
 * Processes raw markdown content, adding any necessary transformations
 * @param content Raw markdown content
 * @returns Processed markdown content
 */
export function processMarkdown(content: string): string {
  // Here we could add any preprocessing we need for the markdown content
  // For example, we could add custom syntax handling, replace tokens, etc.
  return content;
}

/**
 * Creates specialized sections for accordion rendering based on heading IDs
 * @param content Markdown content
 * @returns A map of section ID to content for sections that should be rendered as accordions
 */
export function extractAccordionSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const specialSections = ['earn', 'penalties', 'transfers', 'certificate'];
  
  // Very simple regex-based extraction - this is a basic approach
  // For more complex needs, a proper markdown parser would be better
  const headingRegex = /^## (.+?) {#([\w-]+)}/gm;
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const [, title, id] = match;
    if (specialSections.includes(id)) {
      // Find the start position of this section
      const startPos = match.index;
      
      // Find the next heading or end of content to determine section end
      const nextHeadingRegex = /^## /gm;
      nextHeadingRegex.lastIndex = startPos + match[0].length;
      const nextMatch = nextHeadingRegex.exec(content);
      const endPos = nextMatch ? nextMatch.index : content.length;
      
      // Extract section content
      let sectionContent = content.substring(startPos, endPos).trim();
      // Remove the heading itself since we'll handle it separately
      sectionContent = sectionContent.replace(/^## .+?$/m, '').trim();
      
      sections[id] = sectionContent;
    }
  }
  
  return sections;
} 