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
          // Schema content is server-generated from trusted CMS data.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}
