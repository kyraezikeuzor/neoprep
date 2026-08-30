import type { DomainMastery, MasteryOverview, MasterySubject } from "@/lib/mastery";
import { typography } from "@/lib/typography";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#A3A3A3] transition-transform group-open:rotate-180" fill="none" aria-hidden>
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusColor(domain: DomainMastery) {
  if (domain.status === "mastered" || domain.status === "strong") return "text-[#15803D]";
  if (domain.status === "developing") return "text-[#087EBA]";
  return "text-[#747474]";
}

function DomainRow({ domain }: { domain: DomainMastery }) {
  return (
    <details className="group border-b border-arc-line py-3 last:border-b-0">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`${typography.cardItemTitle} leading-snug`}>{domain.domain}</p>
            <p className={`mt-0.5 ${typography.caption}`}>{domain.evidenceLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`font-sans text-sm font-semibold tabular-nums ${statusColor(domain)}`}>
              {domain.questionCount === 0 ? "—" : `${domain.score}%`}
            </span>
            <ChevronIcon />
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#ECECEC]">
          <div
            className={`h-full rounded-full ${domain.score >= 75 ? "bg-[#22C55E]" : "bg-[#1BB1F6]"}`}
            style={{ width: `${domain.score}%` }}
          />
        </div>
      </summary>

      <div className="mt-3 rounded-xl bg-[#F7F7F7] px-3.5 py-3">
        {domain.skills.length > 0 ? (
          <div className="space-y-3">
            {domain.skills.map((skill) => (
              <div key={skill.skill}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`${typography.caption} min-w-0 text-[#525252]`}>{skill.skill}</p>
                  <span className="shrink-0 font-sans text-xs font-medium tabular-nums text-[#087EBA]">{skill.score}%</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#E5E5E5]">
                  <div className="h-full rounded-full bg-[#1BB1F6]" style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={typography.caption}>Your skill breakdown appears after you practice questions in this domain.</p>
        )}
      </div>
    </details>
  );
}

function SubjectSection({ title, subject, overview }: { title: string; subject: MasterySubject; overview: MasteryOverview }) {
  const domains = overview.domains.filter((domain) => domain.subject === subject);
  return (
    <section>
      <p className={`${typography.cardLabel} font-medium`}>{title}</p>
      <div className="mt-1">
        {domains.map((domain) => <DomainRow key={domain.domain} domain={domain} />)}
      </div>
    </section>
  );
}

export default function MasterySnapshot({ overview }: { overview: MasteryOverview }) {
  return (
    <aside className="arc-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={typography.eyebrow}>Mastery map</p>
          <h2 className={`mt-1.5 ${typography.sectionTitle}`}>Domains and skills</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F7FF] text-[#0890D4]" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
            <path d="M5 18V9M12 18V5M19 18v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M3.5 19.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <p className={`mt-2 ${typography.cardHint}`}>Harder questions contribute more evidence to your score.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-8">
        <SubjectSection title="Math" subject="math" overview={overview} />
        <SubjectSection title="Reading and Writing" subject="reading_writing" overview={overview} />
      </div>

      <details className="group mt-5 rounded-xl border border-[#BDEBFF] bg-[#F3FBFF] px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <p className="font-sans text-xs font-medium text-[#087EBA]">How mastery is calculated</p>
          <ChevronIcon />
        </summary>
        <p className={`mt-2 ${typography.caption}`}>
          Only your latest answer to each unique question counts. Easy questions are worth 1 point, medium 2, and hard 3. Your score builds toward 20 weighted points, then reflects your difficulty-weighted accuracy.
        </p>
      </details>
    </aside>
  );
}
