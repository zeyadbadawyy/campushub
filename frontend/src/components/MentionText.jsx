import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchMentionUsers } from "../services/postService";

const mentionCache = new Map();

function cleanCandidate(value) {
  return value
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .replace(/[()\[\]{}]+$/g, "")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getMentionCandidates(content) {
  const candidates = [];
  const regex = /@([A-Za-z0-9][A-Za-z0-9_.-]*(?:\s+[A-Za-z0-9][A-Za-z0-9_.-]*){0,5})/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const words = cleanCandidate(match[1])
      .split(/\s+/)
      .filter(Boolean);

    for (let length = words.length; length >= 1; length -= 1) {
      const candidate = words.slice(0, length).join(" ");
      candidates.push(candidate);
    }
  }

  return [...new Set(candidates)];
}

async function resolveMention(name) {
  const key = name.toLowerCase();

  if (mentionCache.has(key)) {
    return mentionCache.get(key);
  }

  try {
    const users = await searchMentionUsers(name);
    const exact = (users || []).find(
      (user) =>
        String(user?.name || "").trim().toLowerCase() === key
    );

    mentionCache.set(key, exact || null);
    return exact || null;
  } catch (error) {
    console.error("Could not resolve mention", error);
    mentionCache.set(key, null);
    return null;
  }
}

function getMentionEntries(text, mentions) {
  const supplied = Array.isArray(mentions)
    ? mentions
        .filter((user) => user?.id && user?.name)
        .map((user) => ({
          id: user.id,
          name: String(user.name).trim(),
        }))
    : [];

  if (!supplied.length) {
    return null;
  }

  const sorted = [...supplied].sort(
    (a, b) => b.name.length - a.name.length
  );

  const pattern = sorted
    .map((user) => escapeRegExp(`@${user.name}`))
    .join("|");

  if (!pattern) {
    return null;
  }

  return {
    regex: new RegExp(
      `(${pattern})(?=\\s|$|[.,!?;:)]|\\n)`,
      "gi"
    ),
    lookup: new Map(
      sorted.map((user) => [`@${user.name}`.toLowerCase(), user])
    ),
  };
}

export default function MentionText({
  text: textProp,
  children,
  mentions = [],
}) {
  const content = String(
    textProp !== undefined ? textProp : children ?? ""
  );

  const navigate = useNavigate();
  const [resolved, setResolved] = useState({});

  const candidates = useMemo(
    () => getMentionCandidates(content),
    [content]
  );

  useEffect(() => {
    let cancelled = false;

    async function resolveAll() {
      const results = {};

      for (const candidate of candidates) {
        const user = await resolveMention(candidate);

        if (user) {
          results[candidate.toLowerCase()] = user;
        }
      }

      if (!cancelled) {
        setResolved(results);
      }
    }

    if (candidates.length) {
      resolveAll();
    } else {
      setResolved({});
    }

    return () => {
      cancelled = true;
    };
  }, [candidates]);

  const suppliedEntries = useMemo(
    () => getMentionEntries(content, mentions),
    [content, mentions]
  );

  if (!content) {
    return null;
  }

  // Prefer mention IDs already supplied by the backend/parent.
  if (suppliedEntries) {
    const parts = [];
    let cursor = 0;
    let match;

    while ((match = suppliedEntries.regex.exec(content)) !== null) {
      const rawMention = match[1];
      const user = suppliedEntries.lookup.get(
        rawMention.toLowerCase()
      );

      if (!user) {
        continue;
      }

      if (match.index > cursor) {
        parts.push(
          <span key={`text-${cursor}-${match.index}`}>
            {content.slice(cursor, match.index)}
          </span>
        );
      }

      parts.push(
        <button
          key={`mention-${match.index}-${user.id}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/profile/${user.id}`);
          }}
          className="
            inline cursor-pointer p-0 m-0 align-baseline
            font-semibold text-indigo-600
            underline decoration-indigo-300
            underline-offset-2
            transition hover:text-indigo-700
            hover:decoration-indigo-500
            dark:text-indigo-400
            dark:decoration-indigo-500/60
            dark:hover:text-indigo-300
          "
        >
          {rawMention}
        </button>
      );

      cursor = suppliedEntries.regex.lastIndex;
    }

    if (cursor < content.length) {
      parts.push(
        <span key={`text-${cursor}-end`}>
          {content.slice(cursor)}
        </span>
      );
    }

    return <>{parts}</>;
  }

  // Fallback for older posts/comments where the API does not return
  // structured mention users yet: resolve exact names through the existing
  // mention-search endpoint.
  const parts = [];
  let cursor = 0;
  const mentionRegex = /@([A-Za-z0-9][A-Za-z0-9_.-]*(?:\s+[A-Za-z0-9][A-Za-z0-9_.-]*){0,5})/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const atIndex = match.index;
    const words = cleanCandidate(match[1])
      .split(/\s+/)
      .filter(Boolean);

    let matchedUser = null;
    let matchedLength = 0;

    for (let length = words.length; length >= 1; length -= 1) {
      const candidate = words.slice(0, length).join(" ");
      const user = resolved[candidate.toLowerCase()];

      if (user) {
        matchedUser = user;
        matchedLength = length;
        break;
      }
    }

    if (!matchedUser) {
      continue;
    }

    const matchedName = words
      .slice(0, matchedLength)
      .join(" ");
    const mentionText = `@${matchedName}`;
    const mentionEnd = atIndex + mentionText.length;

    if (atIndex > cursor) {
      parts.push(
        <span key={`text-${cursor}-${atIndex}`}>
          {content.slice(cursor, atIndex)}
        </span>
      );
    }

    parts.push(
      <button
        key={`mention-${atIndex}-${matchedUser.id}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          navigate(`/profile/${matchedUser.id}`);
        }}
        className="
          inline cursor-pointer p-0 m-0 align-baseline
          font-semibold text-indigo-600
          underline decoration-indigo-300
          underline-offset-2
          transition hover:text-indigo-700
          hover:decoration-indigo-500
          dark:text-indigo-400
          dark:decoration-indigo-500/60
          dark:hover:text-indigo-300
        "
      >
        {mentionText}
      </button>
    );

    cursor = mentionEnd;
    mentionRegex.lastIndex = mentionEnd;
  }

  parts.push(
    <span key={`text-${cursor}-end`}>
      {content.slice(cursor)}
    </span>
  );

  return <>{parts}</>;
}
