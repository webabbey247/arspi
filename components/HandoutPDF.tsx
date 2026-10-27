import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

export type HandoutLesson = {
  title: string
  /** Plain text — HTML is stripped before it reaches here, since react-pdf
   *  renders primitives rather than markup. */
  body:  string
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: "#0474C4",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  courseTitle: { fontSize: 10, color: "#6B6560", marginBottom: 4 },
  chapterTitle: {
    fontSize: 22,
    color: "#071639",
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.25,
    marginBottom: 18,
  },
  rule: { borderBottomWidth: 1, borderBottomColor: "#E5E2DC", marginBottom: 22 },
  lessonTitle: {
    fontSize: 13,
    color: "#071639",
    fontFamily: "Helvetica-Bold",
    marginBottom: 7,
  },
  paragraph: { fontSize: 10, color: "#2A3441", lineHeight: 1.65, marginBottom: 8 },
  bullet: {
    fontSize: 10, color: "#2A3441", lineHeight: 1.6,
    marginBottom: 4, paddingLeft: 12,
  },
  lesson: { marginBottom: 20 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#A8A39C",
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

/** Chapter handout — the lesson text of one chapter as a downloadable PDF,
 *  attached to the course as a `pdf` content block. */
export function HandoutPDF({
  courseTitle, chapterTitle, lessons,
}: {
  courseTitle:  string
  chapterTitle: string
  lessons:      HandoutLesson[]
}) {
  return (
    <Document title={`${chapterTitle} — ${courseTitle}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>ARPS Institute · Chapter Handout</Text>
        <Text style={styles.courseTitle}>{courseTitle}</Text>
        <Text style={styles.chapterTitle}>{chapterTitle}</Text>
        <View style={styles.rule} />

        {lessons.map((lesson, i) => (
          <View key={i} style={styles.lesson} wrap={false}>
            <Text style={styles.lessonTitle}>{`${i + 1}. ${lesson.title}`}</Text>
            {lesson.body
              .split(/\n{2,}/)
              .map(block => block.trim())
              .filter(Boolean)
              .map((block, j) =>
                /^[-•]\s+/.test(block) ? (
                  <Text key={j} style={styles.bullet}>{`• ${block.replace(/^[-•]\s+/, "")}`}</Text>
                ) : (
                  <Text key={j} style={styles.paragraph}>{block}</Text>
                )
              )}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{courseTitle}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
