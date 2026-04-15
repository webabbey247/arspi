import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { insights } from "@/lib/data";
import withLayout from "@/hooks/useLayout";

export async function generateStaticParams() {
  return insights.map((ins) => ({ slug: ins.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ins = insights.find((i) => i.slug === slug);
  if (!ins) return {};
  return {
    title: ins.title,
    description: ins.excerpt,
  };
}

// Placeholder long-form body — in production this would come from a CMS or MDX
function ArticleBody({ slug }: { slug: string }) {
  const paragraphs: Record<string, string[]> = {
    "par-sub-saharan-africa": [
      "Participatory Action Research (PAR) has long been positioned as a counter-hegemonic methodology — one that deliberately disrupts the traditional power dynamic between researcher and researched. In Sub-Saharan Africa, however, PAR is undergoing a quiet but consequential transformation. No longer confined to radical social movements or grassroots development projects, PAR is now being deployed by universities, national governments, and international NGOs at significant scale.",
      "The shift is partly driven by donor pressure. Major funders — including FCDO, USAID, and the Gates Foundation — have increasingly signalled their preference for participatory approaches in programme evaluation and community development research. This has prompted a wave of capacity building, with organisations like ARPS Institute at the forefront of training M&E professionals, academics, and policy researchers in PAR methodology.",
      "But scale brings tensions. Traditional PAR emphasises long-term community embeddedness, iterative action cycles, and power-sharing at every stage. When PAR is mainstreamed into standard M&E frameworks or compressed into 12-week consultancy timelines, something often gets lost. Researchers trained in quantitative methods frequently struggle with the non-linearity of PAR; communities accustomed to being 'studied' may not immediately embrace the collaborative model.",
      "There are, nonetheless, encouraging examples of PAR being practised well across the continent. In Ghana, the University of Education Winneba has integrated PAR into its education faculty's pedagogical research programme with notable results — teachers serving as co-researchers in their own classrooms, generating actionable insights that have influenced national curriculum reform. In Rwanda, community health workers trained as participatory researchers have produced community-level health data that outperformed traditional health facility reporting in both accuracy and local uptake.",
      "What makes these examples work is not the methodology per se but the institutional conditions around it: adequate time, genuine power-sharing, and the willingness of institutional partners to act on community-generated knowledge. These conditions remain the exception rather than the rule.",
      "For PAR to realise its potential across Sub-Saharan Africa, three shifts are urgently needed. First, funders must revise their programme cycles to accommodate PAR's iterative nature — short funding windows of 12–18 months are fundamentally incompatible with community-embedded participatory research. Second, universities must invest in training their academic staff not just in PAR theory but in the relational, facilitative, and reflective competencies that PAR demands. Third, governments must create policy environments that formally recognise community-generated evidence — not just as supplementary qualitative data but as legitimate inputs to policy design and evaluation.",
      "The opportunity is real and the momentum is building. Whether it is seized will depend on whether institutions are prepared to genuinely relinquish some control — not just in rhetoric, but in practice.",
    ],
    "me-professionals-ai-tools": [
      "Two years ago, the idea of M&E professionals using AI tools in their daily work felt abstract — the stuff of tech conferences, not field offices in Kampala or Nairobi. Today, it is a practical necessity. Not because AI has solved the fundamental methodological challenges of monitoring and evaluation, but because it has meaningfully changed the speed, cost, and accessibility of several tasks that M&E professionals have always needed to do.",
      "Let us be clear about what AI can and cannot do for M&E practice. It cannot replace the judgement, contextual knowledge, and ethical sensitivity that skilled M&E professionals bring to their work. It cannot design a Theory of Change, interpret community dynamics, or ensure that evaluation findings are used for adaptive management. These require human expertise. What it can do is compress the time spent on literature searching, data cleaning, transcription, report formatting, and preliminary data analysis — freeing practitioners to spend more time on the work that actually requires their expertise.",
      "The tools that matter most right now fall into three broad categories. First, AI-assisted literature review tools — such as Elicit, Research Rabbit, and Semantic Scholar — allow M&E professionals to conduct rapid evidence syntheses that would previously have required weeks of manual database searching. For practitioners who need to ground their evaluation frameworks in evidence quickly, these tools are genuinely transformative.",
      "Second, AI transcription and qualitative data management tools have dramatically reduced the cost of working with interview and focus group data. Tools like Otter.ai, Whisper (via open-source deployment), and NVivo's AI features can transcribe hours of audio in minutes and assist with preliminary theme identification — though human oversight of qualitative interpretation remains essential.",
      "Third, large language models like Claude and GPT-4 can assist with drafting evaluation reports, generating indicator tables, reviewing logframe logic, and translating technical findings into accessible policy briefs. Used well, they function as a highly responsive writing partner — not a replacement for substantive analysis, but a significant accelerator for the communication of findings.",
      "The practical implication for M&E professionals is clear: building familiarity with these tools is no longer optional. Organisations that equip their teams with AI skills will produce more evidence, at lower cost, with faster turnaround — a competitive advantage in a sector where evidence generation is increasingly central to organisational value.",
    ],
  };

  const body = paragraphs[slug] ?? [
    "This insight explores one of the critical themes in contemporary research, education, and development practice. ARPS Institute's experts bring together theory and field experience to offer perspectives that are both rigorous and immediately applicable.",
    "Drawing on evidence from programmes across more than 120 countries, this analysis identifies patterns that practitioners and scholars can use to strengthen their work. We examine both the opportunities and the structural constraints that shape outcomes in this domain.",
    "The implications for practice are concrete. Organisations that take these insights seriously and embed them in their programme design, evaluation frameworks, and learning systems will be better positioned to demonstrate impact and attract continued investment.",
    "ARPS Institute is committed to generating and disseminating knowledge that bridges the gap between academic research and practical application. This article is part of our ongoing series on evidence-based professional development.",
    "We invite your reflections. If you have practitioner experience relevant to this topic, we welcome contributions to our Insights platform. Contact our editorial team at insights@arpsinstitute.org.",
  ];

  return (
    <div className="flex flex-col gap-5">
      {body.map((para, i) => (
        <p
          key={i}
          className="font-body text-[1rem] tracking-[-0.005em] leading-[1.7] font-normal text-slate-600"
        >
          {para}
        </p>
      ))}
    </div>
  );
}

const InsightDetailPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const ins = insights.find((i) => i.slug === slug);
  if (!ins) notFound();

  const idx = insights.indexOf(ins);
  const prev = insights[idx - 1] ?? null;
  const next = insights[idx + 1] ?? null;
  const related = insights
    .filter((i) => i.slug !== ins.slug && i.category === ins.category)
    .slice(0, 3);

  return (
    <>
      {/* Article hero */}
      <section className="bg-[#071639] relative overflow-hidden px-8 md:px-16 lg:py-16 pb-0 w-full">
        <div className="absolute inset-0 bg-grid-ink pointer-events-none" />
        <div className="absolute -top-24 right-0 w-125 h-125 rounded-full bg-[#0474C4]/8 blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-200 mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]">
              {ins.category}
            </Badge>
            {ins.featured && (
              <span className="font-body text-[0.6875rem] tracking-[0.07em] uppercase font-medium text-slate-400">
                Featured
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-[2.25rem] md:text-[2.75rem] lg:text-[3rem] tracking-[-0.015em] text-white md:tracking-[-0.02em] leading-[1.2] md:leading-[1.1] font-bold text-sky-light">
              {ins.title}
            </h1>

            <p className="font-body text-[1.125rem] tracking-[-0.01em] leading-[1.65] font-light text-[#EBF3FC]">
              {ins.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-4 py-4 border-t border-[#0474C4]/15">
            <div className="w-10 h-10 rounded-full bg-[#0474C4] border border-[#0474C4]/50 flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
              {ins.authorInitials}
            </div>

            <div className="flex flex-col justify-start items-start">
              <span className="font-body text-[0.875rem] tracking-[0em] leading-normal font-medium text-white/90">
                {ins.author}
              </span>
              <span className="font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-white/90">
                {ins.date} · {ins.readTime}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-1.5 font-body text-[0.75rem] tracking-[0em] font-normal text-white/90">
              <Clock className="h-3 w-3" />
              {ins.readTime}
            </div>
          </div>
        </div>
      </section>

      {/* Article body + sidebar */}
      <div className="max-w-300 mx-auto px-8 md:px-16 py-16 grid lg:grid-cols-[1fr_280px] gap-14 items-start w-full">
        {/* Body */}
        <article>
          <ArticleBody slug={ins.slug} />

          <div className="mt-10 pt-8 border-t border-sapphire/20 flex items-center gap-4 flex-wrap">
            <span className="text-[0.68rem] uppercase tracking-widest text-slate-400">
              Share:
            </span>
            {["LinkedIn", "Twitter/X", "Copy Link"].map((s) => (
              <button
                key={s}
                className="px-4 py-1.5 text-[0.72rem] border border-sapphire/25 rounded-sm text-slate-500 hover:border-sapphire hover:text-sapphire transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Prev / Next navigation */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {prev ? (
              <Link
                href={`/insights/${prev.slug}`}
                className="group border border-sapphire/20 rounded-sm p-4 hover:border-sapphire/50 transition-all no-underline"
              >
                <span className="flex items-center gap-2 font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  <ArrowLeft className="h-3 w-3" />
                  Previous
                </span>
                <span className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/insights/${next.slug}`}
                className="group border border-sapphire/20 rounded-sm p-4 hover:border-sapphire/50 transition-all no-underline text-right"
              >
                {/* Label — DM Sans, 12px, +0.07em, font-medium, uppercase */}
                <div className="flex items-center justify-end gap-2 font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-slate-400 mb-1.5">
                  Next
                  <ArrowRight className="h-3 w-3" />
                </div>
                {/* Small — DM Sans, 14px, 0em, lh 1.6 */}
                <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-ink group-hover:text-sapphire transition-colors">
                  {next.title}
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          {/* Author card */}
         <div className="bg-white border border-[#0474C4]/25 rounded-sm p-5 flex flex-col gap-4">

  <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4]">
    About the Author
  </div>

  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-full bg-[#0474C4] flex items-center justify-center font-body text-[0.6875rem] font-medium text-[#EBF3FC] shrink-0">
      {ins.authorInitials}
    </div>

    <div>
      <div className="font-body text-[0.875rem] tracking-[0em] leading-normal font-medium text-ink">
        {ins.author}
      </div>

      <div className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mt-1">
        Expert facilitator and researcher at ARPS Institute,
        contributing to professional education and capacity building
        worldwide.
      </div>
    </div>
  </div>

</div>

       {/* Related articles */}
{related.length > 0 && (
  <div className="bg-white border border-[#0474C4]/25 rounded-sm p-5">

    <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-4">
      Related Articles
    </div>

    <div className="flex flex-col gap-0">
      {related.map((r) => (
        <Link
          key={r.slug}
          href={`/insights/${r.slug}`}
          className="group py-3 border-b border-[#0474C4]/18 last:border-b-0 no-underline block"
        >
          <h3 className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-[#262B40] group-hover:text-[#0474C4] transition-colors mb-1">
            {r.title}
          </h3>

          <div className="font-body text-[0.75rem] tracking-[0.05em] leading-normal font-normal text-slate-400">
            {r.date} · {r.readTime}
          </div>
        </Link>
      ))}
    </div>

  </div>
)}

          {/* CTA */}
          <div className="bg-ink rounded-sm p-5">
            <div className="font-heading text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#0474C4] mb-2">
              Deepen Your Practice
            </div>
            <p className="font-body text-[0.875rem] tracking-[0em] leading-[1.6] font-normal text-slate-600 mb-4">
              Explore our certificate programmes — designed to turn insight into
              applied expertise.
            </p>

            <Button
              className="font-body text-[0.75rem] tracking-[0.02em] font-medium w-full bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] py-2 px-5"
              asChild
            >
              <Link href="/programs">Browse Programs <ChevronRight className="h-4 w-4" />{" "}</Link>
            </Button>
          </div>
        </aside>
      </div>

      {/* More from ARPS */}
      {related.length > 0 && (
        <section className="bg-[#EDF2FB] px-8 md:px-16 py-16 w-full">
          <div className="max-w-350 mx-auto flex flex-col gap-12 w-full">
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-2">
                <p className="font-body text-[0.75rem] tracking-[0.07em] uppercase font-medium text-[#637AA3]">
                  Keep Reading
                </p>
                <h2 className="font-heading text-[1.75rem] tracking-[-0.01em] leading-tight font-semibold text-[#0474C4]">
                  More from ARPS Insights
                </h2>
              </div>
              <Button
                variant="default"
                asChild
                className="bg-[#0474C4] hover:bg-[#0474C4]/80 text-[#EBF3FC] rounded-[32px] px-5 py-2"
              >
                <Link href="/insights">
                  All Articles <ChevronRight className="h-4 w-4" />{" "}
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/insights/${r.slug}`}
                  className="flex flex-col gap-4 group bg-white/90 border border-[#0474C4]/25 rounded-sm p-6 hover:border-[#0474C4]/55 hover:-translate-y-0.5 transition-all no-underline"
                >
                  <Badge className="font-body text-[0.6875rem] tracking-[0.05em] font-medium bg-[#0474C4]/10 text-[#0474C4] border-0 px-2 py-0.5">
                    {r.category}
                  </Badge>
                  <h3 className="font-heading line-clamp-2 text-[1.375rem] tracking-[-0.005em] leading-[1.3] font-medium text-[#262B40] group-hover:text-[#0474C4] transition-colors">
                    {r.title}
                  </h3>
                  <div className="h-px bg-[#0474C4]/18 w-full" />
                  <div className="flex items-center justify-between font-body text-[0.75rem] tracking-[0em] leading-normal font-normal text-[#637AA3]">
                    <span>{r.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {r.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default withLayout(InsightDetailPage);
