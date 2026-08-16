"use client";
import { useState, useRef } from "react";

// Parses spoken text like "forty dollars groceries" into a guessed amount
// and account name. Approximate on purpose — always double-check before saving.
function parseSpokenText(text: string, knownCategories: string[]): { amount: string; category: string } {
  const lower = text.toLowerCase();
  const numberWords: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  };
  let amount = "";
  const digitMatch = lower.match(/\d+(\.\d+)?/);
  if (digitMatch) {
    amount = digitMatch[0];
  } else {
    for (const [word, val] of Object.entries(numberWords)) {
      if (lower.includes(word)) { amount = String(val); break; }
    }
  }

  let category = "";
  for (const cat of knownCategories) {
    if (lower.includes(cat.toLowerCase())) { category = cat; break; }
  }
  if (!category) {
    const words = text.split(" ").filter((w) => !/\d/.test(w) && !Object.keys(numberWords).includes(w.toLowerCase()) && !["dollars", "dollar", "for", "on", "spent", "spend"].includes(w.toLowerCase()));
    category = words.slice(-2).join(" ").trim();
  }

  return { amount, category };
}

export function useVoiceInput(knownCategories: string[]) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  const recognitionRef = useRef<any>(null);

  const start = (onResult: (parsed: { amount: string; category: string }, raw: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(parseSpokenText(text, knownCategories), text);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stop = () => recognitionRef.current?.stop();

  return { listening, supported, start, stop };
}
