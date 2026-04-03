"use client";

import React from "react";
import { SuperiorPalatino } from "./periodontograma/SuperiorPalatino";
import { SuperiorVestibular } from "./periodontograma/SuperiorVestibular";
import { InferiorVestibular } from "./periodontograma/InferiorVestibular";
import { InferiorPalatino } from "./periodontograma/InferiorPalatino";

export function TabPeriodontogramaGrafico() {
  return (
    <div className="flex flex-col gap-8 w-full p-4">
      {/* 1. Arcada Superior - Vestibular */}
      <SuperiorVestibular />

      {/* 2. Arcada Superior - Palatino */}
      <SuperiorPalatino />
      {/* 3. Arcada Inferior - Vestibular */}
      <InferiorVestibular />
      {/* 4. Arcada Inferior - Lingual/Palatino */}
      {<InferiorPalatino/>}
      {/* (Aquí irán los inferiores después) */}
    </div>
  );
}