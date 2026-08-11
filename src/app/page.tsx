import Link from "next/link";

const features = [
  {
    emoji: "🐾",
    title: "펫프렌들리 동반여행 추천",
    description: "반려동물 입장이 가능한 업소·관광지를 기준으로 여행 계획을 짜드려요.",
  },
  {
    emoji: "🧒",
    title: "아이와 함께하기 좋은 여행",
    description: "아이와 함께하기 좋은 관광지를 기준으로 여행 계획을 짜드려요.",
  },
  {
    emoji: "📍",
    title: "위치·일자 기반 추천",
    description: "대략적인 위치와 날짜만 정하면, 근처 가볼만한 곳을 자동으로 추천해요.",
  },
  {
    emoji: "🎧",
    title: "오디오 가이드",
    description: "주요 관광지에 담긴 역사와 문화 이야기를 들려주는 오디오 가이드를 제공해요.",
  },
  {
    emoji: "🏅",
    title: "위치기반 스탬프 & 리워드",
    description: "여행지에서 스탬프를 찍고, 목표 여행 계획을 달성하면 리워드를 드려요.",
  },
  {
    emoji: "📅",
    title: "캘린더 연동 & 공유",
    description: "짜여진 여행 계획을 캘린더로 관리하고, 가족·친구를 초대해 함께 공유해요.",
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
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-20 sm:px-10">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-black/[.06] px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
            🐰 🧒 동반여행 플래너
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
            반려동물, 그리고 아이와 함께
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
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              여행 계획 추천받기 →
            </Link>
            <Link
              href="/calendar"
              className="rounded-full border border-black/[.08] px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.08]"
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
                className="flex flex-col gap-3 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <span className="text-3xl">{feature.emoji}</span>
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
        <section className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
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
                <span aria-hidden>✔</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
