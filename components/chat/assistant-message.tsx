"use client";

import { UIMessage } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { Streamdown } from "streamdown";

interface AssistantMessageProps {
  message: UIMessage | undefined;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  if (message === undefined) return "HELLO";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="whitespace-pre-wrap font-mono anti text-sm text-neutral-800 dark:text-neutral-200 overflow-hidden"
        id="markdown"
      >
        <Streamdown className={"max-h-72 overflow-y-scroll no-scrollbar-gutter"}>
          {message.parts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join(" ")}
        </Streamdown>
      </motion.div>
    </AnimatePresence>
  );
}

