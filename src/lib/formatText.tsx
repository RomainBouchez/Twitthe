// src/lib/formatText.tsx
import Link from "next/link";
import React from "react";

export function formatTextWithMentions(text: string | null | undefined) {
  if (!text) return ""; // This will handle null or undefined
  
  // Split text by mention pattern
  const parts = text.split(/(@\w+)/g);
  
  return parts.map((part, index) => {
    // Check if part is a mention
    if (part.match(/^@\w+$/)) {
      const username = part.substring(1); // Remove @ symbol
      return (
        <Link
          key={index} 
          href={`/profile/${username}`}
          className="text-primary font-medium hover:underline"
          >
          {part}
        </Link>
      );
    }
    return part;
  });
}