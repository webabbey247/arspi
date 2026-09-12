/** Renders a JSON-LD structured-data block.
 *
 *  `<` is escaped to its unicode form because a value coming out of the
 *  database (a programme title, an article excerpt) containing `</script>`
 *  would otherwise close the tag early and inject markup into the page. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
