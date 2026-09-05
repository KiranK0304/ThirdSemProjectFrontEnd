import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCpu, FiX, FiSend, FiCheck, FiCopy, 
  FiUsers, FiLayers, FiHelpCircle, FiMail, 
  FiUser, FiSearch, FiZap
} from 'react-icons/fi';
import { useJobCopilot } from '../../hooks/queries/useScreeningQueries';
import { CopilotAction, CopilotMessage, RankedCandidate } from '../../api/types';
import styles from './CopilotDrawer.module.css';

interface CopilotDrawerProps {
  jobId: number;
  jobTitle: string;
  totalCandidates: number;
  candidates: RankedCandidate[];
  selectedCandidateAppId?: number | null;
  onSelectCandidate?: (applicationId: number | null) => void;
  isOpen: boolean;
  onClose: () => void;
  onShortlistCandidate: (applicationId: number, candidateName?: string) => Promise<void> | void;
  shortlistedIds: Set<number>;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: CopilotAction[];
}

// Lightweight clean renderer for markdown formatting in agent responses
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

    // Headers: ### or ##
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} style={{ fontSize: '14.5px', fontWeight: 500, margin: '10px 0 4px 0', color: 'var(--color-text-primary)' }}>
          {formatInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h2-${idx}`} style={{ fontSize: '15px', fontWeight: 500, margin: '12px 0 6px 0', color: 'var(--color-text-primary)' }}>
          {formatInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={`li-${idx}`} style={{ marginBottom: '4px' }}>
          {formatInline(trimmed.substring(2))}
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

// Inline helper for **bold** and `code`
const formatInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 500 }}>{part.slice(2, -2)}</strong>;
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

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  jobId,
  jobTitle,
  totalCandidates,
  candidates,
  selectedCandidateAppId,
  onSelectCandidate,
  isOpen,
  onClose,
  onShortlistCandidate,
  shortlistedIds,
}) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [copiedActionIndex, setCopiedActionIndex] = useState<string | null>(null);
  const [focusedAppId, setFocusedAppId] = useState<number | null>(selectedCandidateAppId ?? null);

  const copilotMutation = useJobCopilot();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep internal focused ID in sync if parent changes it
  useEffect(() => {
    if (selectedCandidateAppId !== undefined) {
      setFocusedAppId(selectedCandidateAppId);
    }
  }, [selectedCandidateAppId]);

  const focusedCandidate = candidates.find((c) => c.application_id === focusedAppId);

  // Initialize greeting on job selection
  useEffect(() => {
    if (jobId) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### TalentWright AI Recruiter Copilot Ready\n\n` +
            `I have analyzed the **${totalCandidates} candidate resumes** for **${jobTitle}**.\n\n` +
            `Use the **Agent Context** selector above to switch between evaluating the entire applicant pool or drilling down into any individual candidate.`,
        },
      ]);
    }
  }, [jobId, jobTitle, totalCandidates]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, copilotMutation.isPending, isOpen]);

  if (!isOpen) return null;

  const handleContextChange = (appId: number | null) => {
    setFocusedAppId(appId);
    onSelectCandidate?.(appId);

    if (appId) {
      const cand = candidates.find((c) => c.application_id === appId);
      if (cand) {
        setMessages((prev) => [
          ...prev,
          {
            id: `focus-${Date.now()}`,
            role: 'assistant',
            content: `### Switched Context to ${cand.candidate_name} (Rank #${cand.rank}, ${cand.final_score.toFixed(1)}% Match)\n\n` +
              `I am now analyzing **${cand.candidate_name}**'s resume against your criteria. What would you like to investigate?`,
          },
        ]);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `focus-all-${Date.now()}`,
          role: 'assistant',
          content: `### Switched Context to Entire Talent Pool\n\n` +
            `Now assessing all **${totalCandidates} applicants** across the leaderboard.`,
        },
      ]);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputValue.trim();
    if (!textToSend || copilotMutation.isPending) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customMessage) setInputValue('');

    // Prepare history for backend API
    const historyPayload: CopilotMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await copilotMutation.mutateAsync({
        jobId,
        request: {
          message: textToSend,
          history: historyPayload,
          candidate_ids: focusedAppId ? [focusedAppId] : [],
        },
      });

      const assistantMessage: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        suggested_actions: response.suggested_actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Copilot request failed:', err);
      const errorMessage: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an issue analyzing the candidates. Please check your connection and try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExecuteAction = async (action: CopilotAction, actionKey: string) => {
    if (action.action_type === 'shortlist' && action.application_id) {
      await onShortlistCandidate(action.application_id, action.candidate_name);
    } else if (action.action_type === 'copy_text' && action.payload) {
      try {
        await navigator.clipboard.writeText(action.payload);
        setCopiedActionIndex(actionKey);
        setTimeout(() => setCopiedActionIndex(null), 2500);
      } catch (err) {
        console.error('Failed to copy text to clipboard:', err);
      }
    }
  };

  const firstName = focusedCandidate
    ? focusedCandidate.candidate_name.split(' ')[0]
    : '';

  return (
    <div className={styles.drawerContainer}>
      {/* Header */}
      <div className={styles.drawerHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.agentAvatar}>
            <FiCpu />
          </div>
          <div className={styles.agentTitleBlock}>
            <h3 className={styles.agentTitle}>
              AI Recruiter Copilot
            </h3>
            <span className={styles.agentSubtitle}>
              <span className={styles.onlinePulse} />
              Active · {totalCandidates} Candidates Analyzed
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close AI Copilot"
        >
          <FiX />
        </button>
      </div>

      {/* Unified Single Drawer Context Bar */}
      <div className={styles.contextBar}>
        <label htmlFor="context-select" className={styles.contextLabel}>
          <FiUser size={13} /> Active Focus:
        </label>
        <select
          id="context-select"
          className={styles.contextSelect}
          value={focusedAppId ?? 'all'}
          onChange={(e) => {
            const val = e.target.value === 'all' ? null : Number(e.target.value);
            handleContextChange(val);
          }}
        >
          <option value="all">🌐 Entire Talent Pool ({totalCandidates} Candidates)</option>
          {candidates.map((c) => (
            <option key={c.application_id} value={c.application_id}>
              #{c.rank} {c.candidate_name} ({c.final_score.toFixed(1)}% Match)
            </option>
          ))}
        </select>
      </div>

      {/* Candidate Focus Mini Card (when an individual candidate is selected) */}
      {focusedCandidate && (
        <div className={styles.candidateFocusCard}>
          <div className={styles.focusCardTop}>
            <span className={styles.focusRank}>#{focusedCandidate.rank}</span>
            <div className={styles.focusNameCol}>
              <span className={styles.focusName}>{focusedCandidate.candidate_name}</span>
              <span className={styles.focusEmail}>{focusedCandidate.candidate_email}</span>
            </div>
            <span className={styles.focusScore}>{focusedCandidate.final_score.toFixed(1)}%</span>
          </div>
          <div className={styles.focusScoresRow}>
            {Object.entries(focusedCandidate.criteria_scores || {}).map(([crit, score]) => (
              <span key={crit} className={styles.focusMiniBadge}>
                {crit}: <strong>{score}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Skills Bar */}
      <div className={styles.skillsSection}>
        <div className={styles.skillsLabel}>Agent Skills & Shortcuts</div>
        <div className={styles.skillsGrid}>
          {focusedCandidate ? (
            <>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage(`Generate 4 tailored interview questions for ${focusedCandidate.candidate_name} probing technical depth, architecture decisions, and potential gaps.`)}
                disabled={copilotMutation.isPending}
              >
                <FiHelpCircle size={13} /> Questions for {firstName}
              </button>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage(`Draft a personalized interview invitation email for ${focusedCandidate.candidate_name} referencing their specific achievements.`)}
                disabled={copilotMutation.isPending}
              >
                <FiMail size={13} /> Draft Invite Email
              </button>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage(`Analyze ${focusedCandidate.candidate_name}'s key strengths, potential weaknesses, and why they scored ${focusedCandidate.final_score.toFixed(1)}%.`)}
                disabled={copilotMutation.isPending}
              >
                <FiSearch size={13} /> Strengths & Gaps
              </button>
              {!shortlistedIds.has(focusedCandidate.application_id) && (
                <button
                  type="button"
                  className={styles.skillButton}
                  onClick={() => handleExecuteAction({
                    action_type: 'shortlist',
                    label: `Shortlist ${focusedCandidate.candidate_name}`,
                    application_id: focusedCandidate.application_id,
                    candidate_name: focusedCandidate.candidate_name,
                  }, 'top-action')}
                >
                  <FiZap size={13} /> Shortlist {firstName}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage('Compare the top 2 ranked candidates side-by-side, evaluate their trade-offs, and recommend the best fit.')}
                disabled={copilotMutation.isPending || totalCandidates < 2}
              >
                <FiLayers size={13} /> Compare Top 2
              </button>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage('Generate 4 tailored interview questions for the top ranked candidate focusing on probing technical depth and potential gaps.')}
                disabled={copilotMutation.isPending || totalCandidates === 0}
              >
                <FiHelpCircle size={13} /> Questions for #1
              </button>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage('Draft a personalized, professional interview invitation email for the top ranked candidate.')}
                disabled={copilotMutation.isPending || totalCandidates === 0}
              >
                <FiMail size={13} /> Draft Top Invite
              </button>
              <button
                type="button"
                className={styles.skillButton}
                onClick={() => handleSendMessage('Provide an executive summary of this applicant talent pool, key skill clusters, and overall candidate readiness.')}
                disabled={copilotMutation.isPending || totalCandidates === 0}
              >
                <FiUsers size={13} /> Talent Pool Summary
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className={styles.chatArea}>
        {messages.map((msg, msgIdx) => {
          const isUser = msg.role === 'user';
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
                    <FiCpu size={14} /> TalentWright Agent
                  </div>
                  <div className={styles.markdownContent}>
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Render Suggested Direct Actions */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div className={styles.actionsContainer}>
                      <span className={styles.actionsLabel}>Recommended Direct Actions:</span>
                      <div className={styles.actionsList}>
                        {msg.suggested_actions.map((act, actIdx) => {
                          const actionKey = `${msgIdx}-${actIdx}`;
                          const isCopied = copiedActionIndex === actionKey;
                          const isShortlisted = act.application_id
                            ? shortlistedIds.has(act.application_id)
                            : false;

                          if (act.action_type === 'shortlist' && isShortlisted) {
                            return (
                              <span
                                key={actionKey}
                                className={`${styles.actionButton} ${styles.actionButtonSuccess}`}
                              >
                                <FiCheck size={12} /> {act.candidate_name || 'Candidate'} Shortlisted
                              </span>
                            );
                          }

                          return (
                            <button
                              key={actionKey}
                              type="button"
                              className={styles.actionButton}
                              onClick={() => handleExecuteAction(act, actionKey)}
                            >
                              {act.action_type === 'shortlist' ? (
                                <>⚡ {act.label}</>
                              ) : isCopied ? (
                                <><FiCheck size={12} /> Copied to Clipboard</>
                              ) : (
                                <><FiCopy size={12} /> {act.label}</>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Agent Thinking Step Indicator */}
        {copilotMutation.isPending && (
          <div className={styles.thinkingRow}>
            <span className={styles.thinkingSpinner} />
            <span>AI Recruiter Agent is analyzing resumes & synthesizing recommendation...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.chatTextarea}
            placeholder={focusedCandidate ? `Ask anything about ${firstName}'s background or experience...` : "Ask about candidate strengths, comparisons, or talent pool insights..."}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={copilotMutation.isPending}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || copilotMutation.isPending}
            aria-label="Send query"
          >
            <FiSend />
          </button>
        </div>
        <div className={styles.inputHint}>
          <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
          <span>Powered by OpenRouter</span>
        </div>
      </div>
    </div>
  );
};

export default CopilotDrawer;
