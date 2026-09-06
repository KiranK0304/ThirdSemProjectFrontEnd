import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCpu, FiX, FiSend, FiCheck, FiPlus, 
  FiSearch, FiAward, FiBarChart2, FiCheckCircle
} from 'react-icons/fi';
import { 
  useJobCopilotSessions, 
  useCreateCopilotSession, 
  useSessionMessages, 
  useSendCopilotMessage 
} from '../../hooks/queries/useCopilotQueries';
import { CopilotMessageItem, CopilotCandidateProfile } from '../../api/types';
import styles from './CopilotDrawer.module.css';

interface CopilotDrawerProps {
  jobId: number;
  jobTitle: string;
  totalCandidates: number;
  isOpen: boolean;
  onClose: () => void;
  onShortlistCandidate: (applicationId: number, candidateName?: string) => Promise<void> | void;
  shortlistedIds: Set<number>;
}

// Inline helper for **bold** and `code`
const formatInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          style={{
            backgroundColor: 'var(--color-surface-muted, #f3f4f6)',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Clean renderer for markdown formatting in agent responses
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '6px 0 8px 18px', padding: 0 }}>
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} style={{ fontSize: '14.5px', fontWeight: 600, margin: '10px 0 4px 0', color: 'var(--color-text-primary)' }}>
          {formatInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${idx}`} style={{ fontSize: '15px', fontWeight: 600, margin: '12px 0 6px 0', color: 'var(--color-text-primary)' }}>
          {formatInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      inList = true;
      const bulletContent = trimmed.replace(/^[-*•]\s*/, '');
      listItems.push(
        <li key={`li-${idx}`} style={{ marginBottom: '4px' }}>
          {formatInline(bulletContent)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      const content = trimmed.replace(/^\d+\.\s/, '');
      listItems.push(
        <li key={`oli-${idx}`} style={{ marginBottom: '4px' }}>
          {formatInline(content)}
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${idx}`} style={{ margin: '0 0 8px 0', lineHeight: 1.55 }}>
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList();
  return elements;
};

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  jobId,
  jobTitle,
  totalCandidates,
  isOpen,
  onClose,
  onShortlistCandidate,
  shortlistedIds,
}) => {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sessions query & mutation
  const { data: sessions, isLoading: isLoadingSessions } = useJobCopilotSessions(jobId);
  const createSessionMutation = useCreateCopilotSession();

  // Messages query & mutation
  const { data: messages, isLoading: isLoadingMessages } = useSessionMessages(activeSessionId);
  const sendMessageMutation = useSendCopilotMessage();

  // Auto-select latest session or create one if none exist
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      if (!activeSessionId || !sessions.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(sessions[0].id);
      }
    }
  }, [sessions, activeSessionId]);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sendMessageMutation.isPending, isOpen]);

  if (!isOpen) return null;

  const handleCreateNewSession = async () => {
    try {
      const newSession = await createSessionMutation.mutateAsync({
        jobId,
        title: `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
      setActiveSessionId(newSession.id);
    } catch (err) {
      console.error('Failed to create copilot session:', err);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputValue.trim();
    if (!textToSend || sendMessageMutation.isPending) return;

    let targetSessionId = activeSessionId;

    // Create session on the fly if none exists yet
    if (!targetSessionId) {
      try {
        const newSession = await createSessionMutation.mutateAsync({
          jobId,
          title: textToSend.slice(0, 40),
        });
        targetSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      } catch (err) {
        console.error('Failed to auto-create session:', err);
        return;
      }
    }

    if (!customMessage) setInputValue('');

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: targetSessionId,
        message: textToSend,
      });
    } catch (err) {
      console.error('Failed to send copilot message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to extract candidate list from metadata
  const extractCandidates = (metadata: any): CopilotCandidateProfile[] => {
    if (!metadata || !metadata.candidates) return [];
    if (Array.isArray(metadata.candidates)) {
      return metadata.candidates;
    }
    // Dict of multiple tools: search_candidates, get_top_candidates, etc.
    const aggregated: CopilotCandidateProfile[] = [];
    for (const val of Object.values(metadata.candidates)) {
      if (Array.isArray(val)) {
        aggregated.push(...(val as CopilotCandidateProfile[]));
      } else if (val && typeof val === 'object' && Array.isArray((val as any).results)) {
        aggregated.push(...(val as any).results);
      }
    }
    return aggregated;
  };

  return (
    <div className={styles.drawerContainer}>
      {/* Header */}
      <div className={styles.drawerHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.agentAvatar}>
            <FiCpu />
          </div>
          <div className={styles.agentTitleBlock}>
            <h2 className={styles.agentTitle}>
              Recruiter AI Copilot
            </h2>
            <p className={styles.agentSubtitle}>
              <span className={styles.onlinePulse} />
              {jobTitle} • {totalCandidates} Applicants Indexed
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close Copilot"
        >
          <FiX />
        </button>
      </div>

      {/* Sessions Bar */}
      <div className={styles.sessionBar}>
        {sessions && sessions.length > 0 ? (
          <select
            className={styles.sessionSelect}
            value={activeSessionId ?? ''}
            onChange={(e) => setActiveSessionId(Number(e.target.value))}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || `Session #${s.id}`} ({s.message_count} msgs)
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            No previous chats
          </span>
        )}
        <button
          type="button"
          className={styles.newSessionBtn}
          onClick={handleCreateNewSession}
          disabled={createSessionMutation.isPending}
          title="Start a new chat thread"
        >
          <FiPlus /> New Chat
        </button>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className={styles.skillsSection}>
        <div className={styles.skillsLabel}>Quick Inquiries</div>
        <div className={styles.skillsGrid}>
          <button
            type="button"
            className={styles.skillButton}
            onClick={() => handleSendMessage("Who are the top 5 candidates for this role?")}
            disabled={sendMessageMutation.isPending}
          >
            <FiAward /> Top Applicants
          </button>
          <button
            type="button"
            className={styles.skillButton}
            onClick={() => handleSendMessage("Find candidates with deep hands-on Python and backend experience")}
            disabled={sendMessageMutation.isPending}
          >
            <FiSearch /> Python & AI Depth
          </button>
          <button
            type="button"
            className={styles.skillButton}
            onClick={() => handleSendMessage("Compare the top 2 candidates and highlight their trade-offs")}
            disabled={sendMessageMutation.isPending}
          >
            <FiBarChart2 /> Compare Candidates
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.chatArea}>
        {(!messages || messages.length === 0) && !isLoadingMessages && (
          <div className={styles.messageRow}>
            <div className={styles.assistantBubble}>
              <div className={styles.assistantHeader}>
                <FiCpu /> Senior Talent Advisor Ready
              </div>
              <div className={styles.markdownContent}>
                <p>
                  Hello! I am your AI Recruiter Copilot for <strong>{jobTitle}</strong>.
                </p>
                <p>
                  I have analyzed the resumes of all <strong>{totalCandidates} applicants</strong> in PostgreSQL with dense semantic vectors.
                </p>
                <p>
                  Ask me anything—such as:
                </p>
                <ul>
                  <li><em>"Who are our strongest candidates?"</em></li>
                  <li><em>"Does anyone have production Kubernetes experience?"</em></li>
                  <li><em>"Who has led technical teams before?"</em></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messages?.map((msg: CopilotMessageItem) => {
          const isUser = msg.role === 'USER';
          const candidates = !isUser ? extractCandidates(msg.metadata) : [];
          const toolsCalled = msg.metadata?.tools_called || [];

          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
            >
              {isUser ? (
                <div className={styles.userBubble}>{msg.content}</div>
              ) : (
                <div className={styles.assistantBubble}>
                  <div className={styles.assistantHeader}>
                    <FiCpu /> Senior Talent Advisor
                  </div>

                  {/* Tool Call Badges */}
                  {toolsCalled.length > 0 && (
                    <div className={styles.toolBadgeList}>
                      {toolsCalled.map((tool, idx) => (
                        <span key={idx} className={styles.toolBadge}>
                          ⚡ Executed {tool.name}
                          {tool.arguments?.query ? `("${tool.arguments.query}")` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Text Markdown */}
                  <div className={styles.markdownContent}>
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Candidate Profile Cards */}
                  {candidates.length > 0 && (
                    <div className={styles.candidateCardsGrid}>
                      {candidates.map((cand) => {
                        const isShortlisted = shortlistedIds.has(cand.application_id);
                        const recTier = (cand.recommendation || '').toUpperCase();
                        let badgeClass = styles.badgeWeak;
                        if (recTier.includes('STRONG')) badgeClass = styles.badgeStrong;
                        else if (recTier.includes('MODERATE')) badgeClass = styles.badgeModerate;

                        return (
                          <div key={cand.application_id} className={styles.candidateCard}>
                            <div className={styles.cardHeader}>
                              <span className={styles.cardName}>{cand.name}</span>
                              <span className={`${styles.cardFitBadge} ${badgeClass}`}>
                                {cand.overall_score?.toFixed(1)}% Match • {cand.recommendation || 'Evaluated'}
                              </span>
                            </div>

                            <div className={styles.cardMetaRow}>
                              <span>App #{cand.application_id}</span>
                              {cand.years_experience ? (
                                <span>{cand.years_experience} Yrs Exp</span>
                              ) : null}
                              {cand.email && <span>{cand.email}</span>}
                            </div>

                            {/* Evidence Quote if Available */}
                            {cand.relevant_evidence && cand.relevant_evidence.length > 0 && (
                              <div className={styles.evidenceBox}>
                                <div className={styles.evidenceSectionTitle}>
                                  Verified Evidence ({cand.relevant_evidence[0].section}):
                                </div>
                                {cand.relevant_evidence[0].details}
                              </div>
                            )}

                            {/* Shortlist Action */}
                            <div className={styles.cardActionsRow}>
                              {isShortlisted ? (
                                <span className={styles.cardShortlistedBadge}>
                                  <FiCheckCircle /> Shortlisted
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.cardShortlistBtn}
                                  onClick={() => onShortlistCandidate(cand.application_id, cand.name)}
                                >
                                  <FiCheck /> Shortlist Candidate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {sendMessageMutation.isPending && (
          <div className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.thinkingRow}>
              <span className={styles.thinkingSpinner} />
              <span>Analyzing candidate resumes and evaluating hiring fit...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about applicants, skills, experience, comparisons..."
            className={styles.chatTextarea}
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
            aria-label="Send Message"
          >
            <FiSend />
          </button>
        </div>
        <div className={styles.inputHint}>
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
        </div>
      </div>
    </div>
  );
};

export default CopilotDrawer;
