import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  useSeekerApprovedConversations,
  useSeekerPendingRequests,
  useEmployerApprovedConversations,
  useEmployerRequests,
  useConversationMessages,
  useSendMessage,
  useUpdateChatRequestStatus,
  useCreateChatRequest,
  useMarkConversationAsRead,
} from '@/hooks/queries/useMessageQueries';
import { useJobs } from '@/hooks/queries/useJobQueries';
import {
  Button,
  Tag,
  Avatar,
  Modal,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import { formatRelativeTime } from '@/utils/date';
import {
  FiSend,
  FiMessageSquare,
  FiClock,
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiInbox,
} from 'react-icons/fi';
import styles from './Messages.module.css';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const isSeeker = user?.account_type === 'SEEKER';

  // Tabs
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');

  // New Request Modal state (Seeker)
  const initialEmployerId = location.state?.employerId?.toString() || '';
  const [isModalOpen, setIsModalOpen] = useState(!!initialEmployerId);
  const [selectedEmployerId, setSelectedEmployerId] = useState<string>(initialEmployerId);
  const [introMessage, setIntroMessage] = useState('');

  // Seeker Queries
  const {
    data: seekerApproved = [],
    isLoading: loadingSeekerApproved,
  } = useSeekerApprovedConversations();
  const {
    data: seekerPending = [],
    isLoading: loadingSeekerPending,
  } = useSeekerPendingRequests();

  // Employer Queries
  const {
    data: employerApproved = [],
    isLoading: loadingEmpApproved,
  } = useEmployerApprovedConversations();
  const {
    data: employerPending = [],
    isLoading: loadingEmpPending,
  } = useEmployerRequests('PENDING');

  // Active list based on role
  const approvedConversations = isSeeker ? seekerApproved : employerApproved;
  const pendingRequests = isSeeker ? seekerPending : employerPending;

  // Selected chat details
  const currentChat = approvedConversations.find((c) => c.id === selectedChatId);

  // Messages Query
  const { data: messages = [], isLoading: loadingMessages } =
    useConversationMessages(selectedChatId);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const updateStatusMutation = useUpdateChatRequestStatus();
  const createRequestMutation = useCreateChatRequest();
  const markReadMutation = useMarkConversationAsRead();

  // Public Jobs query to extract unique employers for "New Connection" modal
  const { data: jobsList = [] } = useJobs();
  const employerOptions = Array.from(
    new Map(
      jobsList
        .filter((j) => j.employer && j.employer.id)
        .map((j) => [j.employer.id, j.employer])
    ).values()
  );

  // Auto-scroll messages to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set default selected chat when approved list loads
  useEffect(() => {
    if (
      approvedConversations.length > 0 &&
      (!selectedChatId || !approvedConversations.some((c) => c.id === selectedChatId))
    ) {
      setSelectedChatId(approvedConversations[0].id);
    }
  }, [approvedConversations, selectedChatId]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (selectedChatId && currentChat && currentChat.unread_messages_count > 0) {
      markReadMutation.mutate(selectedChatId);
    }
  }, [selectedChatId, currentChat]);

  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChatId) return;

    sendMessageMutation.mutate(
      { chatRequestId: selectedChatId, content: messageText.trim() },
      {
        onSuccess: () => {
          setMessageText('');
        },
      }
    );
  };

  // Employer approve/reject handler
  const handleUpdateStatus = (id: number, status: 'APPROVED' | 'REJECTED') => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          if (status === 'APPROVED') {
            setActiveTab('approved');
            setSelectedChatId(id);
          }
        },
      }
    );
  };

  // Create chat request handler (Seeker)
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployerId) return;

    createRequestMutation.mutate(
      {
        employer_id: Number(selectedEmployerId),
        initial_message: introMessage.trim(),
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setSelectedEmployerId('');
          setIntroMessage('');
          setActiveTab('pending');
        },
      }
    );
  };

  const isLoading =
    isSeeker
      ? loadingSeekerApproved || loadingSeekerPending
      : loadingEmpApproved || loadingEmpPending;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Messages</h1>
          <p className={styles.subtitle}>
            {isSeeker
              ? 'Connect and chat directly with approved employers and recruiters.'
              : 'Review candidate connection requests and message approved talent.'}
          </p>
        </div>

        <div className={styles.headerActions}>
          {isSeeker && (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiPlus size={16} /> Connect with Employer
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'approved' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <FiMessageSquare size={16} /> Active Chats
          {approvedConversations.length > 0 && (
            <span className={`${styles.badge} ${activeTab === 'approved' ? styles.badgeActive : ''}`}>
              {approvedConversations.length}
            </span>
          )}
        </button>

        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FiClock size={16} />
          {isSeeker ? 'Pending Requests' : 'Incoming Requests'}
          {pendingRequests.length > 0 && (
            <span className={`${styles.badge} ${activeTab === 'pending' ? styles.badgeActive : ''}`}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ACTIVE CHATS */}
      {activeTab === 'approved' && (
        <>
          {approvedConversations.length === 0 ? (
            <EmptyState
              title="No active conversations yet"
              description={
                isSeeker
                  ? 'When an employer approves your connection request, you can chat with them here.'
                  : 'Approve incoming seeker requests from the Pending tab to start chatting.'
              }
              action={
                isSeeker ? (
                  <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                    Send a Connection Request
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setActiveTab('pending')}>
                    View Incoming Requests
                  </Button>
                )
              }
            />
          ) : (
            <div className={styles.chatContainer}>
              {/* Left Conversation List */}
              <div className={styles.sidebarList}>
                <div className={styles.sidebarHeader}>Direct Messages</div>
                {approvedConversations.map((conv) => {
                  const targetName = isSeeker
                    ? conv.employer.user_name || conv.employer.company_name
                    : conv.seeker.user_name || conv.seeker.user_email;
                  const targetCompany = isSeeker
                    ? conv.employer.company_name
                    : 'Job Seeker';
                  const isSelected = conv.id === selectedChatId;

                  return (
                    <div
                      key={conv.id}
                      className={`${styles.conversationItem} ${
                        isSelected ? styles.conversationItemActive : ''
                      }`}
                      onClick={() => setSelectedChatId(conv.id)}
                    >
                      <Avatar name={targetName} size={40} round />
                      <div className={styles.conversationDetails}>
                        <div className={styles.conversationTop}>
                          <span className={styles.conversationName}>{targetName}</span>
                          <span className={styles.conversationTime}>
                            {formatRelativeTime(conv.updated_at)}
                          </span>
                        </div>
                        <div className={styles.conversationCompany}>{targetCompany}</div>
                        <div className={styles.conversationPreview}>
                          {conv.latest_message
                            ? conv.latest_message.content
                            : conv.initial_message || 'Chat started'}
                        </div>
                      </div>
                      {conv.unread_messages_count > 0 && (
                        <span className={styles.badge}>
                          {conv.unread_messages_count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Chat Pane */}
              <div className={styles.chatPane}>
                {currentChat ? (
                  <>
                    <div className={styles.chatPaneHeader}>
                      <div className={styles.chatTargetInfo}>
                        <Avatar
                          name={
                            isSeeker
                              ? currentChat.employer.company_name
                              : currentChat.seeker.user_name
                          }
                          size={40}
                          round
                        />
                        <div>
                          <div className={styles.chatTargetName}>
                            {isSeeker
                              ? currentChat.employer.company_name
                              : currentChat.seeker.user_name}
                          </div>
                          <div className={styles.chatTargetSub}>
                            {isSeeker
                              ? currentChat.employer.user_email
                              : `${currentChat.seeker.phone || ''} • ${currentChat.seeker.user_email}`}
                          </div>
                        </div>
                      </div>
                      <Tag variant="success">Connected</Tag>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className={styles.messagesArea}>
                      {currentChat.initial_message && (
                        <div className={`${styles.messageRow} ${styles.messageRowOther}`}>
                          <span className={styles.messageSenderName}>
                            {currentChat.seeker.user_name} (Initial Request)
                          </span>
                          <div className={`${styles.messageBubble} ${styles.messageBubbleOther}`}>
                            {currentChat.initial_message}
                          </div>
                          <span className={styles.messageTime}>
                            {formatRelativeTime(currentChat.created_at)}
                          </span>
                        </div>
                      )}

                      {loadingMessages ? (
                        <div style={{ margin: 'auto' }}>
                          <LoadingSpinner size="md" />
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`${styles.messageRow} ${
                              msg.is_from_me
                                ? styles.messageRowMine
                                : styles.messageRowOther
                            }`}
                          >
                            {!msg.is_from_me && (
                              <span className={styles.messageSenderName}>
                                {msg.sender_name || msg.sender_email}
                              </span>
                            )}
                            <div
                              className={`${styles.messageBubble} ${
                                msg.is_from_me
                                  ? styles.messageBubbleMine
                                  : styles.messageBubbleOther
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className={styles.messageTime}>
                              {formatRelativeTime(msg.created_at)}
                              {msg.is_from_me && (msg.is_read ? ' • Read' : ' • Sent')}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className={styles.chatFooter}>
                      <form onSubmit={handleSendMessage} className={styles.chatForm}>
                        <input
                          type="text"
                          className={styles.chatInput}
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          autoFocus
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                        >
                          <FiSend size={16} />
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className={styles.emptySelection}>
                    <FiInbox size={48} />
                    <h3>Select a conversation</h3>
                    <p>Choose a contact from the list on the left to start messaging.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className={styles.pendingContainer}>
          {pendingRequests.length === 0 ? (
            <EmptyState
              title={
                isSeeker ? 'No pending requests' : 'No incoming connection requests'
              }
              description={
                isSeeker
                  ? 'All your connection requests have been responded to.'
                  : 'You do not have any candidate connection requests waiting for review.'
              }
            />
          ) : (
            <div className={styles.requestGrid}>
              {pendingRequests.map((req) => (
                <div key={req.id} className={styles.requestCard}>
                  <div className={styles.requestHeader}>
                    <div className={styles.requestUser}>
                      <Avatar
                        name={
                          isSeeker
                            ? req.employer.company_name
                            : req.seeker.user_name
                        }
                        size={44}
                        round
                      />
                      <div>
                        <div className={styles.requestName}>
                          {isSeeker
                            ? req.employer.company_name
                            : req.seeker.user_name}
                        </div>
                        <div className={styles.requestCompany}>
                          {isSeeker
                            ? `Contact: ${req.employer.user_email}`
                            : req.seeker.user_email}
                        </div>
                      </div>
                    </div>
                    <Tag variant="warning">
                      {isSeeker ? 'Pending Approval' : 'Awaiting Review'}
                    </Tag>
                  </div>

                  {req.initial_message && (
                    <div className={styles.requestBody}>
                      <span className={styles.requestBodyLabel}>Intro Note</span>
                      {req.initial_message}
                    </div>
                  )}

                  {!isSeeker && req.seeker.bio && (
                    <div className={styles.requestBody}>
                      <span className={styles.requestBodyLabel}>Candidate Bio</span>
                      {req.seeker.bio}
                    </div>
                  )}

                  <div className={styles.requestFooter}>
                    <span className={styles.requestDate}>
                      Requested {formatRelativeTime(req.created_at)}
                    </span>

                    {/* Employer Accept/Decline buttons */}
                    {!isSeeker && (
                      <div className={styles.requestActions}>
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <FiXCircle /> Decline
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <FiCheckCircle /> Approve & Chat
                        </Button>
                      </div>
                    )}

                    {/* Seeker status notice */}
                    {isSeeker && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Waiting for employer acceptance
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for Seeker to Send New Connection Request */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect with an Employer"
      >
        <form onSubmit={handleCreateRequest} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Company / Employer</label>
            <select
              className={styles.chatInput}
              value={selectedEmployerId}
              onChange={(e) => setSelectedEmployerId(e.target.value)}
              required
            >
              <option value="">-- Choose an employer --</option>
              {employerOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Intro Message (Optional)</label>
            <textarea
              className={styles.chatInput}
              style={{ height: '90px', padding: '10px 14px', resize: 'vertical' }}
              placeholder="Introduce yourself and why you would like to connect..."
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedEmployerId || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
