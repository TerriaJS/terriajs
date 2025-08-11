export default function highlightKeyword(searchResult, keywordToHighlight) {
  if (!keywordToHighlight) return searchResult;
  const escapedKeyword = keywordToHighlight.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const parts = searchResult.split(new RegExp(`(${escapedKeyword})`, "gi"));
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
}
