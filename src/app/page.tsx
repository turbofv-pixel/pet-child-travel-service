import Link from "next/link";

const features = [
  {
    emoji: "🐾",
    title: "펫프렌들리 동반여행 추천",
    description: "반려동물 입장이 가능한 업소·관광지를 기준으로 여행 계획을 짜드려요.",
    accent: "bg-amber-100 dark:bg-amber-500/15",
  },
  {
    emoji: "🧒",
    title: "아이와 함께하기 좋은 여행",
    description: "아이와 함께하기 좋은 관광지를 기준으로 여행 계획을 짜드려요.",
    accent: "bg-sky-100 dark:bg-sky-500/15",
  },
  {
    emoji: "📍",
    title: "위치·일자 기반 추천",
    description: "대략적인 위치와 날짜만 정하면, 근처 가볼만한 곳을 자동으로 추천해요.",
    accent: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  {
    emoji: "🎧",
    title: "오디오 가이드",
    description: "주요 관광지에 담긴 역사와 문화 이야기를 들려주는 오디오 가이드를 제공해요.",
    accent: "bg-violet-100 dark:bg-violet-500/15",
  },
  {
    emoji: "🏅",
    title: "위치기반 스탬프 & 리워드",
    description: "여행지에서 스탬프를 찍고, 목표 여행 계획을 달성하면 리워드를 드려요.",
    accent: "bg-rose-100 dark:bg-rose-500/15",
  },
  {
    emoji: "📅",
    title: "캘린더 연동 & 공유",
    description: "짜여진 여행 계획을 캘린더로 관리하고, 가족·친구를 초대해 함께 공유해요.",
    accent: "bg-cyan-100 dark:bg-cyan-500/15",
  },
];

const partnerBenefits = [
  "올원 모임통장",
  "가족 여행 적금",
  "반려동물 보험 연결",
  "지역 농협·하나로마트 할인쿠폰",
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      {/* 배경 그라디언트 블롭 - 은은한 포인트 컬러 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-0 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
      />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-20 sm:px-10">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-black/[.06] dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/[.08]">
            🐰 🧒 동반여행 플래너
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            반려동물, 그리고{" "}
            <span className="bg-gradient-to-r from-amber-500 to-sky-500 bg-clip-text text-transparent">
              아이와 함께
            </span>
            <br />
            떠나는 여행을 더 쉽게
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            펫프렌들리 업소와 아이와 가볼만한 곳을 기준으로 여행 계획을 추천하고,
            캘린더로 일정을 관리하며 가족·친구와 공유하는 동반여행 서비스예요.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/plan"
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/20 transition-transform hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/30"
            >
              여행 계획 추천받기 →
            </Link>
            <Link
              href="/calendar"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black shadow-sm ring-1 ring-black/[.08] transition-colors hover:bg-black/[.04] dark:bg-zinc-900 dark:text-zinc-50 dark:ring-white/[.145] dark:hover:bg-white/[.08]"
            >
              📅 내 캘린더 보기
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
            핵심 기능
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex flex-col gap-3 rounded-2xl border border-black/[.06] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/[.08] dark:bg-zinc-950"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${feature.accent}`}
                >
                  {feature.emoji}
                </span>
                <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* NH affiliate tie-ins */}
        <section className="flex flex-col gap-4 rounded-2xl border border-black/[.06] bg-gradient-to-br from-white to-zinc-50 p-8 shadow-sm dark:border-white/[.08] dark:from-zinc-950 dark:to-black">
          <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
            NH 계열사 연계 (검토 중)
          </h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            가족 여행에 필요한 자금 관리와 보험까지 한 서비스 안에서 이어질 수 있도록
            검토하고 있는 연계 항목들이에요.
          </p>
          <ul className="grid grid-cols-1 gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            {partnerBenefits.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="text-emerald-500">
                  ✔
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
