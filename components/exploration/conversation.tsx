"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import type { DecisionInput, Scenario } from "../../lib/domain";
import { demoChat } from "../../lib/demo";

type Message = { role: "user" | "assistant"; content: string };

const questions = ["What would be the hardest part?", "What should I do this week?", "What might I have to give up?"];

export function Conversation({ input, scenario, demo }: { input: DecisionInput; scenario: Scenario; demo: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function ask(value: string) {
    const content = value.trim();
    if (!content || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setQuestion("");
    setError("");
    setPending(true);
    try {
      let answer: string;
      if (demo) {
        answer = demoChat(scenario, content);
      } else {
        const response = await fetch("/api/conversation", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, scenario, question: content, history: messages.slice(-8) }), signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        answer = result.source === "demo" ? `Offline example response\n\n${result.answer}` : result.answer;
      }
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch {
      if (controller.signal.aborted) return;
      setError("The conversation is temporarily unavailable. You can send your question again.");
      setMessages(messages);
      setQuestion(content);
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="future-conversation">
      <div className="future-voice"><Sparkles size={19} /><div><strong>Letter from a possible future</strong><p>Imagine you tried this path. What might you wish you knew today?</p></div></div>
      <p className="voice-note">{demo ? "Offline example conversation" : "AI role-play grounded in this scenario"} · An imagined perspective</p>
      <div className="voice-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`voice-message voice-${message.role}`} key={index}><small>{message.role === "user" ? "YOU, TODAY" : "POSSIBLE FUTURE SELF"}</small><p>{message.content}</p></div>
        ))}
        {pending && <p className="voice-note">Drafting a reply…</p>}
      </div>
      {messages.length === 0 && <div className="voice-prompts">{questions.map((prompt) => <button key={prompt} disabled={pending} onClick={() => void ask(prompt)}>{prompt}</button>)}</div>}
      {error && <p role="alert" className="voice-note">{error}</p>}
      <form className="voice-form" onSubmit={submit}>
        <input aria-label="Question for your possible future self" maxLength={600} placeholder="Ask your future self…" value={question} onChange={(event) => setQuestion(event.target.value)} />
        <button aria-label="Send question" disabled={pending || !question.trim()}><ArrowUp size={18} /></button>
      </form>
    </div>
  );
}
