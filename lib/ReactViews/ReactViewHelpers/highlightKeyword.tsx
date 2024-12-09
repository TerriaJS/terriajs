import React from "react";

// Really really lightweight highlight without pulling in react-highlight-words
// pros: lightweight
// cons: ???
export default function highlightKeyword(
  searchResult: any,
  keywordToHighlight: any
) {
  if (!keywordToHighlight) return searchResult;
  const parts = searchResult.split(new RegExp(`(${keywordToHighlight})`, "gi"));
  return (
    <>
      {parts.map((part: any, i: any) => (
        <span
          key={i}
          style={
            part.toLowerCase() === keywordToHighlight.toLowerCase()
              ? { fontWeight: "bold" }
              : {}
          }
        >
          {part}
        </span>
      ))}
    </>
  );
}
