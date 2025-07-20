  import React, {type ReactNode } from 'react';
import type {Components} from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table } from "@/components/ui/table";

// Custom renderer for headings that can be used as accordion triggers
export const MarkdownComponents: Components = {
  // Handle headings with special formatting
  h2: ({ children, id }) => {
    // Check if this heading has an id that might indicate it should be an accordion item
    const specialSections = ['earn', 'penalties', 'transfers', 'certificate'];
    
    if (id && specialSections.includes(id)) {
      return (
        <AccordionItem value={id} key={id}>
          <AccordionTrigger className="text-lg">{children}</AccordionTrigger>
          {/* Content will be rendered separately */}
        </AccordionItem>
      );
    }
    
    // Default heading rendering
    return <h2 className="text-2xl font-bold mb-4" id={id}>{children}</h2>;
  },
  
  // Custom paragraph handling for accordion content
  p: ({ children, node }) => {
    // Check if this paragraph follows a special heading
    // @ts-ignore
    const parent = node.parent;
    const prevSibling = parent && parent.children ? 
      parent.children.indexOf(node as any) > 0 ? 
        parent.children[parent.children.indexOf(node as any) - 1] : null : null;
        
    if (prevSibling && prevSibling.type === 'element' && prevSibling.tagName === 'h2') {
      const headingId = (prevSibling.properties as any)?.id;
      const specialSections = ['earn', 'penalties', 'transfers', 'certificate'];
      
      if (headingId && specialSections.includes(headingId as string)) {
        return <AccordionContent>{children}</AccordionContent>;
      }
    }
    
    // Default paragraph rendering
    return <p className="mb-4">{children}</p>;
  },
  
  // Custom table rendering using Shadcn UI table components
  table: ({ children }) => {
    return <div className="my-4 w-full overflow-auto"><Table>{children}</Table></div>;
  },
  
  thead: ({ children }) => {
    return <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>;
  },
  
  tbody: ({ children }) => {
    return <tbody>{children}</tbody>;
  },
  
  tr: ({ children }) => {
    return <tr className="border-b transition-colors hover:bg-muted/50">{children}</tr>;
  },
  
  th: ({ children }) => {
    return <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{children}</th>;
  },
  
  td: ({ children }) => {
    return <td className="p-4 align-middle">{children}</td>;
  },
  
  // Custom image rendering
  img: ({ src, alt }) => {
    return (
      <div className="my-6">
        <img 
          src={src} 
          alt={alt || ''} 
          className="rounded-md max-w-full mx-auto" 
        />
        {alt && <p className="text-center text-sm text-muted-foreground mt-2">{alt}</p>}
      </div>
    );
  },
  
  // Blockquote with custom styling
  blockquote: ({ children }) => {
    return (
      <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
};

// Special component to handle accordion structure
export const MarkdownAccordion: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Accordion type="single" collapsible className="w-full">
      {children}
    </Accordion>
  );
}; 