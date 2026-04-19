import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#060D14",
    padding: 0,
    fontFamily: "Helvetica",
  },
  // Gold border frame
  frame: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1.5,
    borderColor: "#C8A96E",
    borderStyle: "solid",
  },
  // Inner accent line
  frameInner: {
    position: "absolute",
    top: 30,
    left: 30,
    right: 30,
    bottom: 30,
    borderWidth: 0.5,
    borderColor: "rgba(200,169,110,0.35)",
    borderStyle: "solid",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 64,
    paddingVertical: 56,
  },
  // Top badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  badgeLine: {
    height: 0.75,
    width: 40,
    backgroundColor: "#C8A96E",
  },
  badgeText: {
    fontSize: 7.5,
    letterSpacing: 4,
    color: "#C8A96E",
    textTransform: "uppercase",
    marginHorizontal: 10,
  },
  // Institute name
  institute: {
    fontSize: 9,
    letterSpacing: 3,
    color: "rgba(247,243,237,0.45)",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  // Certificate heading
  heading: {
    fontSize: 32,
    color: "#F7F3ED",
    fontFamily: "Helvetica",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  subheading: {
    fontSize: 10,
    color: "rgba(247,243,237,0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 32,
    textAlign: "center",
  },
  // Divider
  divider: {
    width: 48,
    height: 1.5,
    backgroundColor: "#C8A96E",
    marginBottom: 32,
  },
  // "This certifies that"
  certifiesLabel: {
    fontSize: 9,
    color: "rgba(247,243,237,0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    textAlign: "center",
  },
  // Recipient name
  recipientName: {
    fontSize: 30,
    color: "#C8A96E",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 20,
    textAlign: "center",
  },
  // "has successfully completed"
  completedLabel: {
    fontSize: 9,
    color: "rgba(247,243,237,0.45)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    textAlign: "center",
  },
  // Program title
  programTitle: {
    fontSize: 16,
    color: "#F7F3ED",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  // Date row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 36,
    gap: 32,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 7,
    color: "rgba(247,243,237,0.35)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 9.5,
    color: "rgba(247,243,237,0.75)",
    letterSpacing: 0.5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#C8A96E",
    opacity: 0.4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerLine: {
    height: 0.5,
    width: 200,
    backgroundColor: "rgba(200,169,110,0.25)",
    marginBottom: 10,
  },
  footerVerify: {
    fontSize: 7,
    color: "rgba(247,243,237,0.3)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  footerUrl: {
    fontSize: 7.5,
    color: "rgba(200,169,110,0.6)",
    marginTop: 3,
    textAlign: "center",
  },
})

type Props = {
  recipientName:  string
  programTitle:   string
  facilitator:    string | null
  issuedAt:       string   // formatted date string
  verifyCode:     string
  verifyBaseUrl:  string   // e.g. "https://arspi.org"
}

export function CertificatePDF({
  recipientName,
  programTitle,
  facilitator,
  issuedAt,
  verifyCode,
  verifyBaseUrl,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative border frames */}
        <View style={styles.frame} />
        <View style={styles.frameInner} />

        {/* Main body */}
        <View style={styles.body}>

          {/* Top badge */}
          <View style={styles.badge}>
            <View style={styles.badgeLine} />
            <Text style={styles.badgeText}>Certificate of Completion</Text>
            <View style={styles.badgeLine} />
          </View>

          <Text style={styles.institute}>ARPS Institute</Text>

          <Text style={styles.heading}>Certificate</Text>
          <Text style={styles.subheading}>of Completion</Text>

          <View style={styles.divider} />

          <Text style={styles.certifiesLabel}>This certifies that</Text>
          <Text style={styles.recipientName}>{recipientName}</Text>
          <Text style={styles.completedLabel}>has successfully completed</Text>
          <Text style={styles.programTitle}>{programTitle}</Text>

          {/* Meta row: date · facilitator */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date Issued</Text>
              <Text style={styles.metaValue}>{issuedAt}</Text>
            </View>
            <View style={styles.metaDot} />
            {facilitator && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Programme Facilitator</Text>
                <Text style={styles.metaValue}>{facilitator}</Text>
              </View>
            )}
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Certificate ID</Text>
              <Text style={styles.metaValue}>{verifyCode.slice(0, 12).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Footer verify strip */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerVerify}>Verify authenticity at</Text>
          <Text style={styles.footerUrl}>{verifyBaseUrl}/verify/{verifyCode}</Text>
        </View>
      </Page>
    </Document>
  )
}
