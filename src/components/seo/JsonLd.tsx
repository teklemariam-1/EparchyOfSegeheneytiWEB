/**
 * Renders a JSON-LD structured-data <script> tag.
 * Accepts a single schema object or an array of them.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[]
}) {
  const json = Array.isArray(data) ? data : [data]
  return (
    <>
      {json.map((entry, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Content is server-generated from CMS data, but a stray "</script>"
          // (or "<") inside any string field would break out of the tag, so
          // escape "<" — the one character that can end the script element.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
