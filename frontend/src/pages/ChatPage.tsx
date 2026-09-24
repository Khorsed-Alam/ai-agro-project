/**
 * AgroAI — 1-to-1 Chat Page
 * Route: /messages
 * Real-time messaging between Farm Owners and their assigned Farmers.
 * Access Control: Only conversation participants can view/send messages.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  ConversationRecord,
  ChatMessage,
  FarmerProfile,
} from '../services/ecosystem';
import {
  getUserConversations,
  getOrCreateConversation,
  sendChatMessage,
  subscribeToMessages,
  getRegisteredFarmers,
  ECOSYSTEM_UPDATED_EVENT,
} from '../services/ecosystem';

export const ChatPage: React.FC = () => {
  const { user, userProfile, userRole } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [loading, setLoading] = useState(false);

  // For owner: list of farmers to start new conversation with
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [showNewConvPanel, setShowNewConvPanel] = useState(false);
  const [startingConvWith, setStartingConvWith] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    const convs = await getUserConversations(user.uid);
    setConversations(convs);
    setLoading(false);
  }, [user?.uid]);

  const loadFarmers = useCallback(async () => {
    if (userRole === 'owner') {
      const list = await getRegisteredFarmers();
      setFarmers(list);
    }
  }, [userRole]);

  useEffect(() => {
    loadConversations();
    loadFarmers();
    window.addEventListener(ECOSYSTEM_UPDATED_EVENT, loadConversations);
    return () => window.removeEventListener(ECOSYSTEM_UPDATED_EVENT, loadConversations);
  }, [loadConversations, loadFarmers]);

  // Subscribe to real-time messages when a conversation is selected
  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!selectedConv || !user?.uid) return;

    const unsub = subscribeToMessages(selectedConv.id, user.uid, (msgs) => {
      setMessages(msgs);
    });
    unsubscribeRef.current = unsub;

    return () => {
      unsub();
    };
  }, [selectedConv?.id, user?.uid]);

  const handleSelectConversation = (conv: ConversationRecord) => {
    setSelectedConv(conv);
    setSendError('');
    setMessageText('');
  };

  const handleStartConversation = async (farmer: FarmerProfile) => {
    if (!user?.uid || !userProfile?.fullName) return;
    setStartingConvWith(farmer.uid);
    try {
      const conv = await getOrCreateConversation({
        ownerId: user.uid,
        farmerId: farmer.uid,
        ownerName: userProfile.fullName,
        farmerName: farmer.fullName,
      });
      await loadConversations();
      setSelectedConv(conv);
      setShowNewConvPanel(false);
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setStartingConvWith(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv || !user?.uid) return;

    setSending(true);
    setSendError('');

    const receiverId = userRole === 'owner' ? selectedConv.farmerId : selectedConv.ownerId;
    const result = await sendChatMessage({
      conversationId: selectedConv.id,
      senderId: user.uid,
      senderName: userProfile?.fullName || 'User',
      receiverId,
      text: messageText.trim(),
    });

    if (result.success) {
      setMessageText('');
      // In offline mode, add message manually
      if (result.message) {
        setMessages((prev) => [...prev, result.message!]);
      }
    } else {
      setSendError(result.error || 'Failed to send message.');
    }
    setSending(false);
  };

  const getConvDisplayName = (conv: ConversationRecord) => {
    if (userRole === 'owner') return conv.farmerName;
    return conv.ownerName;
  };

  const getConvInitial = (conv: ConversationRecord) => {
    const name = getConvDisplayName(conv);
    return name?.charAt(0).toUpperCase() || '?';
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatMessageTime = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] px-margin-lg py-space-md gap-space-md max-w-[1400px] w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">chat</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Messages</h1>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm">
            {userRole === 'owner'
              ? 'Direct messages with your assigned farmers'
              : 'Direct messages with your farm owner'}
          </p>
        </div>

        {/* Start New Conversation (Owner only) */}
        {userRole === 'owner' && (
          <button
            type="button"
            onClick={() => setShowNewConvPanel(!showNewConvPanel)}
            className="h-9 px-space-md rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>New Message</span>
          </button>
        )}
      </div>

      {/* New Conversation Panel (Owner) */}
      {showNewConvPanel && userRole === 'owner' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-space-md flex flex-col gap-space-sm shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-sm text-on-surface font-semibold">Start Conversation With</h3>
            <button
              type="button"
              onClick={() => setShowNewConvPanel(false)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {farmers.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-4">No registered farmers found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {farmers.map((farmer) => (
                <button
                  key={farmer.uid}
                  type="button"
                  disabled={startingConvWith === farmer.uid}
                  onClick={() => handleStartConversation(farmer)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-outline-variant/20 hover:border-primary hover:bg-primary-container/10 transition-all text-left disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {farmer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-on-surface truncate">{farmer.fullName}</span>
                    <span className="text-[11px] text-on-surface-variant truncate">{farmer.email}</span>
                  </div>
                  {startingConvWith === farmer.uid && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex gap-gutter flex-1 min-h-0">
        {/* Conversations List */}
        <div className="w-72 flex-shrink-0 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden shadow-sm">
          <div className="p-space-sm border-b border-outline-variant/20">
            <h3 className="font-headline-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold px-1">
              Conversations ({conversations.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[32px]">chat_bubble_outline</span>
                <p className="text-xs text-on-surface-variant">
                  {userRole === 'owner'
                    ? 'Click "New Message" to start a conversation with a farmer.'
                    : 'No conversations yet. Your owner will reach out when you are assigned.'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 px-space-sm transition-all text-left border-b border-outline-variant/10 last:border-0 ${
                      isSelected
                        ? 'bg-primary-container/15 border-l-4 border-l-primary'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {getConvInitial(conv)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface truncate">{getConvDisplayName(conv)}</span>
                        <span className="text-[10px] text-on-surface-variant flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt || conv.createdAt)}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <span className="text-[11px] text-on-surface-variant truncate mt-0.5">{conv.lastMessage}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden shadow-sm min-w-0">
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[38px]">forum</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-headline-md text-on-surface text-lg font-semibold">Select a Conversation</h3>
                <p className="font-body-sm text-on-surface-variant text-sm max-w-xs">
                  {userRole === 'owner'
                    ? 'Choose a conversation from the list or start a new one with a farmer.'
                    : 'Select a conversation to view and send messages.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="flex items-center gap-3 p-space-md border-b border-outline-variant/20 bg-surface-container-lowest">
                <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {getConvInitial(selectedConv)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-on-surface">{getConvDisplayName(selectedConv)}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {userRole === 'owner' ? 'Farmer' : 'Farm Owner'}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-3">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                    <span className="material-symbols-outlined text-on-surface-variant text-[30px]">chat</span>
                    <p className="text-xs text-on-surface-variant">No messages yet. Send the first one!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col max-w-[70%] gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                          {!isMine && (
                            <span className="text-[10px] text-on-surface-variant font-semibold ml-2">
                              {msg.senderName}
                            </span>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? 'bg-primary text-on-primary rounded-br-sm'
                                : 'bg-surface-container text-on-surface rounded-bl-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-on-surface-variant mx-2">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-outline-variant/20 p-space-sm bg-surface-container-lowest">
                {sendError && (
                  <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {sendError}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
                    maxLength={1000}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="h-10 w-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-all disabled:opacity-50 flex-shrink-0"
                    title="Send message (Enter)"
                  >
                    {sending ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    )}
                  </button>
                </form>
                <p className="text-[10px] text-on-surface-variant mt-1 text-right">
                  Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
