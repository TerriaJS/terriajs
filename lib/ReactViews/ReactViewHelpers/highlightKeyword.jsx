import React from "react";

// Really really lightweight highlight without pulling in react-highlight-words
// pros: lightweight
// cons: ???
export default function highlightKeyword(searchResult, keywordToHighlight) {
  if (!keywordToHighlight) return searchResult;
  try {
    const parts = searchResult.split(
      new RegExp(`(${keywordToHighlight})`, "gi")
    );
    return (
      <>
        {parts.map((part, i) => (
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
  } catch (e) {
    console.log(e);
    return searchResult;
  }
}
