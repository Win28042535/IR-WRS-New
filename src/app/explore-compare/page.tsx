"use client";

// Review page: current Explore photos next to the new flat mocks, per question and choice.
// Temporary — for choosing between the two sets; not linked from the app.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QUIZ } from "@/lib/data";
import { ExploreMock } from "@/components/ExploreMock";

function Box({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-[14px] border border-ir-border bg-ir-card" style={{ paddingTop: "56.42%" }}>
        <div className="absolute inset-0">{children}</div>
      </div>
      <figcaption className="mt-2 text-[13px] text-ir-t3">{caption}</figcaption>
    </figure>
  );
}

export default function ExploreCompare() {
  return (
    <Suspense>
      <CompareBody />
    </Suspense>
  );
}

function CompareBody() {
  // ?solo=q2-a shows one mock edge to edge — for checking detail at full size.
  const solo = useSearchParams().get("solo");
  if (solo) {
    return (
      <div className="fixed inset-0 z-[100] bg-white">
        <div style={{ width: "100vw", height: "56.42vw" }}><ExploreMock id={solo} /></div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-10">
      <h1 className="text-[32px] font-semibold tracking-[-0.02em]">เปรียบเทียบภาพ “สำรวจแนวทาง”</h1>
      <p className="mt-2 text-[15px] text-ir-t2">ซ้าย: ภาพเดิมจาก Drive · ขวา: Mock ใหม่ (วาดบน grid 12 คอลัมน์ ต่างกันเฉพาะเรื่องที่ข้อนั้นถาม)</p>
      {QUIZ.map((q, qi) => (
        <section key={q.id} className="mt-12">
          <p className="text-[13px] font-semibold text-ir-accent-text">{String(qi + 1).padStart(2, "0")} — {q.topic}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">{q.question}</h2>
          {(["A", "B"] as const).map((L) => {
            const o = L === "A" ? q.optionA : q.optionB;
            return (
              <div key={L} className="mt-5 grid gap-4 md:grid-cols-2">
                <Box caption={`${L} · ${o.label} — ภาพเดิม`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.image} alt="" className="w-full h-full object-cover" />
                </Box>
                <Box caption={`${L} · ${o.label} — Mock ใหม่`}>
                  <ExploreMock id={`${q.id}-${L.toLowerCase()}`} />
                </Box>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
