"use client";

import { useEffect, useRef, useState } from "react";
import type { Spot } from "@/types";

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "unavailable" | "error";

/**
 * 오디오 가이드 - TourAPI 상세조회로 소개글을 가져와서 브라우저 내장
 * 음성합성(Web Speech API)으로 읽어줍니다. 별도 TTS 서비스/키가 필요 없어요.
 */
export function AudioGuideButton({ spot }: { spot: Spot }) {
  // 카카오/샘플 데이터 출처 스팟은 TourAPI contentId가 아니라서 소개글을
  // 조회할 방법 자체가 없어요 (spot.hasAudioGuide는 TourAPI 원본 스팟에만
  // true). 눌러보고서야 "콘텐츠 없음"을 아는 헛클릭을 없애려고, 애초에
  // 재생 버튼 대신 안내만 보여줍니다.
  if (!spot.hasAudioGuide) {
    return (
      <p className="w-fit rounded-full bg-black/[.04] px-3 py-1 text-xs text-zinc-400 dark:bg-white/[.06] dark:text-zinc-500">
        🎧 이 장소는 오디오 가이드가 없어요
      </p>
    );
  }

  return <AudioGuidePlayer spot={spot} />;
}

/** TourAPI 원본 스팟에서만 쓰이는 실제 재생 UI. */
function AudioGuidePlayer({ spot }: { spot: Spot }) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [overview, setOverview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setState("unavailable");
      setMessage("이 브라우저는 음성 읽기를 지원하지 않아요. 아래 글로 읽어주세요.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.onend = () => setState("idle");
    utterance.onerror = () => {
      setState("error");
      setMessage("음성 재생에 실패했어요 (기기/브라우저에 한국어 음성이 없을 수 있어요). 아래 글로 읽어주세요.");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState("playing");
    setMessage(null);
  }

  async function handleClick() {
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }

    if (overview) {
      speak(overview);
      return;
    }

    setState("loading");
    setMessage(null);

    try {
      const res = await fetch(`/api/spot-overview?contentId=${encodeURIComponent(spot.sourceId)}`);
      const body = await res.json();

      if (!body.overview) {
        setState("unavailable");
        setMessage("이 장소는 오디오 가이드 콘텐츠가 없어요.");
        return;
      }

      setOverview(body.overview);
      speak(body.overview);
    } catch {
      setState("error");
      setMessage("오디오 가이드를 불러오지 못했어요.");
    }
  }

  const label =
    state === "loading"
      ? "불러오는 중..."
      : state === "playing"
        ? "⏸️ 일시정지"
        : state === "paused"
          ? "▶️ 계속 듣기"
          : "🎧 오디오 가이드 듣기";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading" || state === "unavailable"}
        className="w-fit rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200 disabled:cursor-default disabled:opacity-60 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
      >
        {label}
      </button>
      {message && (
        <p className="text-xs text-zinc-400">{message}</p>
      )}
      {overview && state !== "loading" && state !== "idle" && (
        <p className="max-h-24 overflow-y-auto rounded-lg bg-black/[.03] p-2 text-xs leading-5 text-zinc-600 dark:bg-white/[.05] dark:text-zinc-400">
          {overview}
        </p>
      )}
    </div>
  );
}
