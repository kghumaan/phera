'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import React from 'react';
import { weddingService } from '@/lib/supabase/wedding-service';
import { toast } from 'sonner';
import { Message, QuestionId, AnswerHistoryEntry, ClassifyResponse, FIELD_LABELS, STEP_LABELS } from './types';
import { QUESTIONS, generateAIResponse, getQuestionText, getNextQuestion, determineStartQuestion, isFormQuestion } from './question-flow';
import { renderFormComponent, renderAddAnotherPrompt, FormRenderHandlers } from './form-renderer';

export function useBuildAI(weddingSlug: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<QuestionId>('partner1_name');
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const collectedDataRef = useRef(collectedData);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleDayIds, setScheduleDayIds] = useState<Record<string, string>>({});
  const [answerHistory, setAnswerHistory] = useState<AnswerHistoryEntry[]>([]);
  const [returnToQuestionId, setReturnToQuestionId] = useState<QuestionId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const currentQuestionIdRef = useRef<QuestionId>(currentQuestionId);

  // Sync refs with state
  useEffect(() => {
    collectedDataRef.current = collectedData;
  }, [collectedData]);

  useEffect(() => {
    currentQuestionIdRef.current = currentQuestionId;
  }, [currentQuestionId]);

  // Initialize BroadcastChannel
  useEffect(() => {
    channelRef.current = new BroadcastChannel('phera-design-sync');
    return () => { channelRef.current?.close(); };
  }, []);

  const broadcastUpdate = useCallback((updates: Record<string, any>) => {
    if (channelRef.current && weddingId) {
      channelRef.current.postMessage({ type: 'DESIGN_UPDATE', weddingId, updates });
    }
  }, [weddingId]);

  // ── Build Form Handlers ───────────────────────────────────────────────────

  const buildFormHandlers = useCallback((overrideData?: Record<string, any>, overrideWeddingId?: string): FormRenderHandlers => ({
    onEventFormSave: (eventData, qId) => handleEventFormSave(eventData, qId),
    onEventFormCancel: (qId) => handleEventFormCancel(qId),
    onDateFormSave: handleDateFormSave,
    onDateFormSkip: handleDateFormSkip,
    onFAQFormSave: handleFAQFormSave,
    onFAQFormCancel: handleFAQFormCancel,
    onRegistryFormSave: handleRegistryFormSave,
    onRegistryFormCancel: handleRegistryFormCancel,
    onTravelFormSave: handleTravelFormSave,
    onTravelFormCancel: handleTravelFormCancel,
    onShoppingFormSave: handleShoppingFormSave,
    onShoppingFormCancel: handleShoppingFormCancel,
    onPinFormSave: handlePinFormSave,
    onPinFormCancel: handlePinFormCancel,
    onCoupleImagesSave: handleCoupleImagesSave,
    onCoupleImagesCancel: handleCoupleImagesCancel,
    onFrameSelectionSave: handleFrameSelectionSave,
    onFrameSelectionCancel: handleFrameSelectionCancel,
    onLookFeelSave: handleLookFeelSave,
    onLookFeelCancel: handleLookFeelCancel,
    onCountChange: (val: number) => handleSend(val.toString()),
    onQuickReply: (text: string) => handleSend(text),
    collectedData: overrideData || collectedDataRef.current,
    weddingId: overrideWeddingId || weddingId,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [weddingId]);

  // ── Load Wedding Data ───────────────────────────────────────────────────────

  useEffect(() => {
    const loadWedding = async () => {
      try {
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (!wedding) return;

        setWeddingId(wedding.id);

        const existingData: Record<string, any> = {};
        if (wedding.partner1_name) existingData.partner1_name = wedding.partner1_name;
        if (wedding.partner2_name) {
          existingData.partner2_name = wedding.partner2_name;
          existingData.couple_name = wedding.couple_name;
        }
        if (wedding.venue_name) existingData.venue_name = wedding.venue_name;
        if (wedding.venue_location) existingData.venue_location = wedding.venue_location;
        if (wedding.welcome_text) existingData.welcome_text = wedding.welcome_text;
        if (wedding.background_image) existingData.background_image = wedding.background_image;
        if (wedding.primary_color) existingData.primary_color = wedding.primary_color;
        if (wedding.website_layout) existingData.website_layout = wedding.website_layout;
        if (wedding.rsvp_deadline) existingData.rsvp_deadline = wedding.rsvp_deadline;
        if (wedding.frame_image_url) existingData.frame_image_url = wedding.frame_image_url;
        if (wedding.couple_images && Array.isArray(wedding.couple_images) && (wedding.couple_images as any[]).length > 0) {
          existingData.couple_images = wedding.couple_images;
          existingData.couple_image_url = (wedding.couple_images as string[])[0] || wedding.couple_image_url;
        } else if (wedding.couple_image_url) {
          existingData.couple_images = [wedding.couple_image_url];
          existingData.couple_image_url = wedding.couple_image_url;
        }

        const [scheduleData, faqData, registryData, travelData, shopData, settingsData] = await Promise.all([
          weddingService.getWeddingSchedule(wedding.id),
          weddingService.getFAQs(wedding.id),
          weddingService.getRegistry(wedding.id),
          weddingService.getTravelCards(wedding.id),
          weddingService.getShops(wedding.id),
          weddingService.getSettings(wedding.id),
        ]);

        existingData._has_schedule = scheduleData && scheduleData.length > 0;
        existingData._schedule_days_count = scheduleData ? scheduleData.length : 1;
        existingData._has_faqs = faqData && faqData.length > 0;
        existingData._has_registry = registryData && registryData.length > 0;
        existingData._has_travel = travelData && travelData.length > 0;
        existingData._has_shopping = shopData && shopData.length > 0;
        existingData._has_couple_images = !!(existingData.couple_images && (existingData.couple_images as any[]).length > 0);
        existingData._has_frame_selection = !!existingData.frame_image_url;
        existingData._has_look_feel = !!(existingData.background_image || existingData.primary_color || existingData.website_layout);
        existingData._has_pins = settingsData?.pin_codes && (settingsData.pin_codes as any[]).length > 0;

        setCollectedData(existingData);

        const startQuestion = determineStartQuestion(existingData);
        setCurrentQuestionId(startQuestion);

        const initialMessages: Message[] = [
          { id: 'init-1', role: 'ai', text: "Hey! 👋 I'm Phera, your AI wedding website builder." },
        ];

        const startMsg: Message = {
          id: 'init-2',
          role: 'ai',
          text: getQuestionText(QUESTIONS[startQuestion], existingData),
        };

        startMsg.component = renderFormComponent(startQuestion, buildFormHandlers(existingData, wedding.id));

        initialMessages.push(startMsg);
        setMessages(initialMessages);
      } catch (err) {
        console.error('Error loading wedding:', err);
        toast.error('Failed to load wedding data');
      } finally {
        setIsLoading(false);
      }
    };

    loadWedding();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingSlug]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Database Persistence ────────────────────────────────────────────────────

  const saveToDatabase = useCallback(async (data: Record<string, any>) => {
    if (!weddingId) return;
    try {
      const dbData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null && !key.startsWith('_')) acc[key] = value;
        return acc;
      }, {} as Record<string, any>);

      if (Object.keys(dbData).length > 0) {
        await weddingService.updateWedding(weddingId, dbData);
        broadcastUpdate(dbData);
      }
    } catch (err) {
      console.error('Error saving to database:', err);
      toast.error('Failed to save changes');
    }
  }, [weddingId, broadcastUpdate]);

  const saveSpecialData = useCallback(async (
    questionId: QuestionId,
    parsedData: Record<string, any>,
    newCollectedData: Record<string, any>,
  ) => {
    if (!weddingId) return;

    const weddingStartDate = newCollectedData.wedding_date
      ? new Date(newCollectedData.wedding_date)
      : new Date();

    try {
      if (questionId.startsWith('day') && questionId.endsWith('_events')) {
        const dayMatch = questionId.match(/day(\d+)_events/);
        const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        const key = `day${dayNum}`;

        let dayId = scheduleDayIds[key];
        if (!dayId) {
          const date = new Date(weddingStartDate);
          date.setDate(date.getDate() + (dayNum - 1));
          const day = await weddingService.createSchedule({
            wedding_id: weddingId,
            day_name: `Day ${dayNum}`,
            date: date.toISOString().split('T')[0],
            order_index: dayNum - 1,
          });
          if (day) {
            dayId = day.id;
            setScheduleDayIds(prev => ({ ...prev, [key]: day.id }));
          }
        }

        if (dayId && parsedData) {
          await weddingService.createScheduleItem({
            schedule_id: dayId,
            name: parsedData.name,
            time: parsedData.time,
            description: parsedData.description,
            location: parsedData.location,
            is_major_event: parsedData.is_major_event ?? true,
            order_index: Math.floor(Date.now() / 1000),
          });
        }
      } else if (questionId === 'faq_item' && (parsedData._faq_items || []).length > 0) {
        for (let i = 0; i < parsedData._faq_items.length; i++) {
          const faq = parsedData._faq_items[i];
          await weddingService.createFAQ({
            wedding_id: weddingId,
            question: faq.question,
            answer: faq.answer,
            order_index: i,
          });
        }
      } else if (questionId === 'registry_item') {
        const validItems = (parsedData._registry_items || []).filter((r: any) => r.external_url);
        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          await weddingService.createRegistryItem({
            wedding_id: weddingId,
            fund_name: item.fund_name,
            emoji: item.emoji || '🎁',
            external_url: item.external_url,
            order_index: i,
          });
        }
      } else if (questionId === 'travel_item' && parsedData) {
        await weddingService.createTravelCard({
          wedding_id: weddingId,
          title: parsedData.title,
          content: parsedData.content ? [parsedData.content] : [],
          image_url: '',
          button_text: parsedData.button_text || null,
          button_action: parsedData.button_url || null,
          order_index: Math.floor(Date.now() / 1000),
        });
      } else if (questionId === 'shopping_item' && parsedData) {
        await weddingService.createShop({
          wedding_id: weddingId,
          name: parsedData.name,
          details: parsedData.details || null,
          url: parsedData.url,
          order_index: Math.floor(Date.now() / 1000),
        });
      } else if (questionId === 'pin_item' && parsedData) {
        const existingSettings = await weddingService.getSettings(weddingId);
        const newPin = {
          pin: parsedData.pin,
          type: parsedData.type || 'guest',
          allows_plus_one: parsedData.allows_plus_one || false,
          skip_rsvp: parsedData.skip_rsvp || false,
          hidden_events: parsedData.hidden_events || [],
        };
        if (existingSettings?.id) {
          const currentPins = (existingSettings.pin_codes as any[]) || [];
          await weddingService.updateSettings(weddingId, { pin_codes: [...currentPins, newPin] });
        } else {
          await weddingService.createSettings({ wedding_id: weddingId, pin_codes: [newPin] });
        }
      }
    } catch (err) {
      console.error(`Error saving special data for ${questionId}:`, err);
    }
  }, [weddingId, scheduleDayIds]);

  // ── Advance to Next Question Helper ─────────────────────────────────────────

  const advanceToQuestion = useCallback((nextQId: QuestionId, newCollectedData: Record<string, any>) => {
    setCurrentQuestionId(nextQId);

    if (nextQId !== 'complete') {
      const nextQ = QUESTIONS[nextQId];
      const nextMsg: Message = {
        id: `ai-q-${Date.now()}`,
        role: 'ai',
        text: getQuestionText(nextQ, newCollectedData),
      };

      nextMsg.component = renderFormComponent(nextQId, buildFormHandlers(newCollectedData));

      setMessages(prev => [...prev, nextMsg]);
    } else {
      setMessages(prev => [...prev, { id: `ai-complete-${Date.now()}`, role: 'ai', text: QUESTIONS.complete.question as string }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId, buildFormHandlers]);

  // ── Classify Intent via API ──────────────────────────────────────────────────

  const classifyIntent = useCallback(async (message: string): Promise<ClassifyResponse> => {
    try {
      const collectedFields = Object.keys(collectedDataRef.current).filter(k => !k.startsWith('_'));
      const response = await fetch('/api/build-ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentQuestionId,
          collectedFields,
          availableFields: FIELD_LABELS,
        }),
      });
      if (!response.ok) return { intent: 'answer' };
      return await response.json();
    } catch {
      return { intent: 'answer' };
    }
  }, [currentQuestionId]);

  // ── General Inquiry Handler ─────────────────────────────────────────────────

  const handleGeneralInquiry = useCallback(async (message: string) => {
    try {
      const data = collectedDataRef.current;

      // Build wedding data summary
      const weddingData: Record<string, any> = {
        couple_name: data.couple_name,
        venue_name: data.venue_name,
        venue_location: data.venue_location,
        wedding_date: data.wedding_date,
        primary_color: data.primary_color,
        website_layout: data.website_layout,
        has_faqs: data._has_faqs,
        has_registry: data._has_registry,
        has_travel: data._has_travel,
        has_shopping: data._has_shopping,
      };

      // Fetch RSVP stats and event names
      if (weddingId) {
        const [rsvpStats, events, settings] = await Promise.all([
          weddingService.getRSVPStats(weddingId),
          weddingService.getWeddingEvents(weddingId),
          weddingService.getSettings(weddingId),
        ]);
        weddingData.rsvp_stats = rsvpStats;
        weddingData.event_names = events.map(e => e.name);
        weddingData.pin_count = settings?.pin_codes ? (settings.pin_codes as any[]).length : 0;
      }

      const response = await fetch('/api/build-ai/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, weddingData }),
      });

      if (!response.ok) throw new Error('Inquiry API failed');

      const result = await response.json();
      return result.response;
    } catch {
      return "I'm not sure about that — you can check the admin dashboard for details.";
    }
  }, [weddingId]);

  // ── Main Send Handler ───────────────────────────────────────────────────────

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    // Use ref to get the CURRENT questionId (avoids stale closure)
    const activeQuestionId = currentQuestionIdRef.current;

    // Skip classify for quick replies / form-driven inputs (overrideText means button click)
    let intent: ClassifyResponse = { intent: 'answer' };
    if (!overrideText && activeQuestionId !== 'complete') {
      intent = await classifyIntent(text);
    }

    // Handle different intents
    if (intent.intent === 'go_back' && intent.targetField && QUESTIONS[intent.targetField as QuestionId]) {
      const targetQId = intent.targetField as QuestionId;
      setReturnToQuestionId(activeQuestionId);

      setTimeout(() => {
        setIsTyping(false);
        const currentValue = collectedDataRef.current[QUESTIONS[targetQId].field as string] || '';
        setMessages(prev => [...prev, {
          id: `ai-goback-${Date.now()}`,
          role: 'ai',
          text: `Sure! Let's update that. Current value: **${currentValue || '(not set)'}**`,
        }]);
        advanceToQuestion(targetQId, collectedDataRef.current);
      }, 600);
      return;
    }

    if (intent.intent === 'change_value' && intent.targetField && intent.extractedValue) {
      const targetQId = intent.targetField as QuestionId;
      const question = QUESTIONS[targetQId];
      if (question) {
        const parsedData = question.parser(intent.extractedValue);
        const newCollectedData = { ...collectedDataRef.current, ...parsedData };
        setCollectedData(newCollectedData);
        await saveToDatabase(parsedData);

        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: `ai-changed-${Date.now()}`,
            role: 'ai',
            text: `Done! I've updated that for you. ✅`,
          }]);
        }, 600);
        return;
      }
    }

    if (intent.intent === 'question' && intent.helpResponse) {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-help-${Date.now()}`,
          role: 'ai',
          text: intent.helpResponse!,
        }]);
      }, 600);
      return;
    }

    if (intent.intent === 'general_inquiry') {
      const response = await handleGeneralInquiry(text);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-inquiry-${Date.now()}`,
          role: 'ai',
          text: response + "\n\nAnything else, or shall we continue building?",
        }]);
      }, 600);
      return;
    }

    if (intent.intent === 'unclear') {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `ai-unclear-${Date.now()}`,
          role: 'ai',
          text: "I didn't quite catch that. Could you rephrase or just answer the question above?",
        }]);
      }, 600);
      return;
    }

    // Default: intent is 'answer' — proceed normally
    const currentQuestion = QUESTIONS[activeQuestionId];
    const parsedData = currentQuestion.parser(text);

    // For partner2_name, also compute couple_name
    if (activeQuestionId === 'partner2_name') {
      parsedData.couple_name = `${collectedDataRef.current.partner1_name || ''} & ${parsedData.partner2_name}`;
    }

    const newCollectedData = { ...collectedDataRef.current, ...parsedData };
    setCollectedData(newCollectedData);

    // Track answer history
    setAnswerHistory(prev => [...prev, { questionId: activeQuestionId, answer: text, parsedData }]);

    // If returning from a go-back, return to original question
    const isReturning = returnToQuestionId !== null;
    if (isReturning) {
      setReturnToQuestionId(null);
    }

    await saveToDatabase(parsedData);
    await saveSpecialData(activeQuestionId, parsedData, newCollectedData);

    setTimeout(() => {
      const ackResponse = generateAIResponse(currentQuestion, parsedData, newCollectedData);
      const nextQuestionId = isReturning && returnToQuestionId
        ? returnToQuestionId
        : getNextQuestion(activeQuestionId, parsedData, newCollectedData);

      const newMessages: Message[] = [];
      if (ackResponse) newMessages.push({ id: `ai-ack-${Date.now()}`, role: 'ai', text: ackResponse });

      setIsTyping(false);
      setMessages(prev => [...prev, ...newMessages]);

      setTimeout(() => {
        advanceToQuestion(nextQuestionId, newCollectedData);
      }, 100);
    }, 800 + Math.random() * 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, currentQuestionId, saveToDatabase, saveSpecialData, advanceToQuestion, classifyIntent, returnToQuestionId, handleGeneralInquiry]);

  // ── Repeatable Item Helpers ─────────────────────────────────────────────────

  const showAddAnotherPrompt = useCallback((
    confirmText: string,
    onAddAnother: () => void,
    onDone: () => void,
    doneLabel: string,
  ) => {
    setMessages(prev => [...prev, {
      id: `ai-confirm-${Date.now()}`,
      role: 'ai',
      text: confirmText,
      component: renderAddAnotherPrompt(onAddAnother, onDone, doneLabel),
    }]);
  }, []);

  // ── Form Save Handlers ─────────────────────────────────────────────────────

  const handleEventFormSave = async (eventData: any, qId: QuestionId) => {
    setMessages(prev => [...prev, {
      id: `user-evt-${Date.now()}`,
      role: 'user',
      text: `Added **${eventData.name}** at ${eventData.time}`
    }]);

    await saveSpecialData(qId, eventData, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "Great! Added. Add another event for this day, or say **'done'** to move on.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatEventForm').default,
              {
                onSave: (data: any) => handleEventFormSave(data, qId),
                onCancel: () => handleEventFormCancel(qId),
              }
            ),
          }]);
        },
        () => handleEventFormCancel(qId),
        'Done with this Day'
      );
    }, 600);
  };

  const handleEventFormCancel = (currentQId: QuestionId) => {
    const nextQId = getNextQuestion(currentQId, {}, collectedDataRef.current);
    setCurrentQuestionId(nextQId);

    setMessages(prev => [...prev, { id: `user-done-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  const handleFAQFormSave = async (faqData: any) => {
    setMessages(prev => [...prev, {
      id: `user-faq-${Date.now()}`,
      role: 'user',
      text: `Added FAQ: **${faqData.question}**`
    }]);

    await saveSpecialData('faq_item', { _faq_items: [faqData] }, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "Got it! Added. Add another FAQ, or say **'done'** to move on.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-faq-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatFAQForm').default,
              {
                onSave: (data: any) => handleFAQFormSave(data),
                onCancel: () => handleFAQFormCancel(),
              }
            ),
          }]);
        },
        () => handleFAQFormCancel(),
        'Done with FAQs'
      );
    }, 600);
  };

  const handleFAQFormCancel = () => {
    const nextQId = QUESTIONS['faq_item'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setMessages(prev => [...prev, { id: `user-done-faq-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  const handleRegistryFormSave = async (regData: any) => {
    setMessages(prev => [...prev, {
      id: `user-reg-${Date.now()}`,
      role: 'user',
      text: `Added Registry: **${regData.fund_name}**`
    }]);

    await saveSpecialData('registry_item', { _registry_items: [regData] }, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "Got it! Added. Add another registry link, or say **'done'** to move on.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-reg-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatRegistryForm').default,
              {
                onSave: (data: any) => handleRegistryFormSave(data),
                onCancel: () => handleRegistryFormCancel(),
              }
            ),
          }]);
        },
        () => handleRegistryFormCancel(),
        'Done with Registry'
      );
    }, 600);
  };

  const handleRegistryFormCancel = () => {
    const nextQId = QUESTIONS['registry_item'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setMessages(prev => [...prev, { id: `user-done-reg-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  const handleTravelFormSave = async (travelData: any) => {
    setMessages(prev => [...prev, {
      id: `user-travel-${Date.now()}`,
      role: 'user',
      text: `Added travel card: **${travelData.title}**`
    }]);

    await saveSpecialData('travel_item', travelData, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "Travel card added! Add another, or say **'done'** to move on.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-travel-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatTravelForm').default,
              {
                onSave: (data: any) => handleTravelFormSave(data),
                onCancel: () => handleTravelFormCancel(),
              }
            ),
          }]);
        },
        () => handleTravelFormCancel(),
        'Done with Travel'
      );
    }, 600);
  };

  const handleTravelFormCancel = () => {
    const nextQId = QUESTIONS['travel_item'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setMessages(prev => [...prev, { id: `user-done-travel-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  const handleShoppingFormSave = async (shopData: any) => {
    setMessages(prev => [...prev, {
      id: `user-shop-${Date.now()}`,
      role: 'user',
      text: `Added shop: **${shopData.name}**`
    }]);

    await saveSpecialData('shopping_item', shopData, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "Shop added! Add another, or say **'done'** to move on.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-shop-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatShoppingForm').default,
              {
                onSave: (data: any) => handleShoppingFormSave(data),
                onCancel: () => handleShoppingFormCancel(),
              }
            ),
          }]);
        },
        () => handleShoppingFormCancel(),
        'Done with Shopping'
      );
    }, 600);
  };

  const handleShoppingFormCancel = () => {
    const nextQId = QUESTIONS['shopping_item'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setMessages(prev => [...prev, { id: `user-done-shop-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  const handlePinFormSave = async (pinData: any) => {
    setMessages(prev => [...prev, {
      id: `user-pin-${Date.now()}`,
      role: 'user',
      text: `Added PIN: **${pinData.pin}** (${pinData.type})`
    }]);

    await saveSpecialData('pin_item', pinData, collectedDataRef.current);

    setTimeout(() => {
      showAddAnotherPrompt(
        "PIN added! Add another, or say **'done'** to finish.",
        () => {
          setMessages(curr => [...curr, {
            id: `ai-q-more-pin-${Date.now()}`,
            role: 'ai',
            text: "Okay, add another one.",
            component: React.createElement(
              require('@/components/admin/build-ai/ChatPinForm').default,
              {
                onSave: (data: any) => handlePinFormSave(data),
                onCancel: () => handlePinFormCancel(),
                weddingId,
              }
            ),
          }]);
        },
        () => handlePinFormCancel(),
        'Done with PINs'
      );
    }, 600);
  };

  const handlePinFormCancel = () => {
    const nextQId = QUESTIONS['pin_item'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setMessages(prev => [...prev, { id: `user-done-pin-${Date.now()}`, role: 'user', text: 'Done' }]);
    setTimeout(() => advanceToQuestion(nextQId, collectedDataRef.current), 600);
  };

  // ── Couple Images Handler ────────────────────────────────────────────────

  const handleCoupleImagesSave = async (images: string[]) => {
    const count = images.length;
    setMessages(prev => [...prev, {
      id: `user-couple-img-${Date.now()}`,
      role: 'user',
      text: `Uploaded ${count} photo${count > 1 ? 's' : ''}`,
    }]);

    const updateData: Record<string, any> = {
      couple_images: images,
      couple_image_url: images[0] || null,
    };

    const newCollectedData = { ...collectedDataRef.current, ...updateData, _has_couple_images: true };
    setCollectedData(newCollectedData);
    await saveToDatabase(updateData);

    setTimeout(() => {
      const ack: Message = { id: `ai-couple-img-ack-${Date.now()}`, role: 'ai', text: `${count} photo${count > 1 ? 's' : ''} uploaded! Looking great! 📸` };
      setMessages(prev => [...prev, ack]);

      const nextQId = QUESTIONS['couple_images'].nextQuestion as QuestionId;
      setCurrentQuestionId(nextQId);
      setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 100);
    }, 600);
  };

  const handleCoupleImagesCancel = () => {
    const newCollectedData = { ...collectedDataRef.current, _has_couple_images: true };
    setCollectedData(newCollectedData);

    setMessages(prev => [...prev, { id: `user-skip-couple-img-${Date.now()}`, role: 'user', text: 'Skipped' }]);

    const nextQId = QUESTIONS['couple_images'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 600);
  };

  // ── Frame Selection Handler ─────────────────────────────────────────────

  const handleFrameSelectionSave = async (frameUrl: string | null) => {
    setMessages(prev => [...prev, {
      id: `user-frame-${Date.now()}`,
      role: 'user',
      text: frameUrl ? 'Selected a frame' : 'No frame selected',
    }]);

    const updateData: Record<string, any> = { frame_image_url: frameUrl };
    const newCollectedData = { ...collectedDataRef.current, ...updateData, _has_frame_selection: true };
    setCollectedData(newCollectedData);
    await saveToDatabase(updateData);

    setTimeout(() => {
      const ack: Message = { id: `ai-frame-ack-${Date.now()}`, role: 'ai', text: frameUrl ? "Beautiful frame choice! 🖼️" : "No frame selected — you can add one anytime in the Design section." };
      setMessages(prev => [...prev, ack]);

      const nextQId = QUESTIONS['frame_selection'].nextQuestion as QuestionId;
      setCurrentQuestionId(nextQId);
      setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 100);
    }, 600);
  };

  const handleFrameSelectionCancel = () => {
    const newCollectedData = { ...collectedDataRef.current, _has_frame_selection: true };
    setCollectedData(newCollectedData);

    setMessages(prev => [...prev, { id: `user-skip-frame-${Date.now()}`, role: 'user', text: 'Skipped' }]);

    const nextQId = QUESTIONS['frame_selection'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 600);
  };

  // ── Look & Feel Handler ───────────────────────────────────────────────────

  const handleLookFeelSave = async (designData: Record<string, any>) => {
    setMessages(prev => [...prev, { id: `user-design-${Date.now()}`, role: 'user', text: 'Saved design settings' }]);

    const newCollectedData = { ...collectedDataRef.current, ...designData, _has_look_feel: true };
    setCollectedData(newCollectedData);
    await saveToDatabase(designData);

    setTimeout(() => {
      const ack: Message = { id: `ai-design-ack-${Date.now()}`, role: 'ai', text: "Looking gorgeous! Your design choices are saved. ✨" };
      setMessages(prev => [...prev, ack]);

      const nextQId = QUESTIONS['look_feel'].nextQuestion as QuestionId;
      setCurrentQuestionId(nextQId);
      setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 100);
    }, 600);
  };

  const handleLookFeelCancel = () => {
    // Skip look_feel and move on
    const newCollectedData = { ...collectedDataRef.current, _has_look_feel: true };
    setCollectedData(newCollectedData);

    setMessages(prev => [...prev, { id: `user-skip-design-${Date.now()}`, role: 'user', text: 'Skipped' }]);

    const nextQId = QUESTIONS['look_feel'].nextQuestion as QuestionId;
    setCurrentQuestionId(nextQId);
    setTimeout(() => advanceToQuestion(nextQId, newCollectedData), 600);
  };

  const handleDateFormSave = (date: Date | null, formatted: string, qId: QuestionId) => {
    setMessages(prev => [...prev, { id: `user-date-${Date.now()}`, role: 'user', text: formatted }]);

    const update = { rsvp_deadline: formatted };

    const newCollectedData = { ...collectedDataRef.current, ...update };
    setCollectedData(newCollectedData);
    saveToDatabase(update);

    setTimeout(() => {
      const nextQId = QUESTIONS[qId].nextQuestion as QuestionId;
      setCurrentQuestionId(nextQId);
      advanceToQuestion(nextQId, newCollectedData);
    }, 600);
  };

  const handleDateFormSkip = (qId: QuestionId) => {
    setMessages(prev => [...prev, { id: `user-skip-${Date.now()}`, role: 'user', text: "No deadline" }]);

    const update = { rsvp_deadline: '' };
    const newCollectedData = { ...collectedDataRef.current, ...update };
    setCollectedData(newCollectedData);
    saveToDatabase(update);

    setTimeout(() => {
      const nextQId = QUESTIONS[qId].nextQuestion as QuestionId;
      setCurrentQuestionId(nextQId);
      advanceToQuestion(nextQId, newCollectedData);
    }, 600);
  };

  // ── Go Back To Step ─────────────────────────────────────────────────────────

  const completedSteps = Object.entries(STEP_LABELS)
    .filter(([qId]) => {
      const q = QUESTIONS[qId as QuestionId];
      if (!q) return false;
      const fields = Array.isArray(q.field) ? q.field : [q.field];
      // Check if any field has data, or if the corresponding _has_ flag is set
      return fields.some(f => collectedData[f] != null && collectedData[f] !== '') ||
        collectedData[`_has_${qId}`] === true ||
        // Special checks for intro questions with _add_ flags
        collectedData[`_add_${qId.replace('_intro', 's')}`] !== undefined ||
        collectedData[`_add_${qId.replace('_intro', '')}`] !== undefined;
    })
    .map(([qId, label]) => ({ questionId: qId as QuestionId, label: label! }));

  const goBackToStep = useCallback((targetQId: QuestionId) => {
    setReturnToQuestionId(currentQuestionIdRef.current);

    const currentValue = collectedDataRef.current[QUESTIONS[targetQId]?.field as string] || '';
    setMessages(prev => [...prev, {
      id: `user-goback-${Date.now()}`,
      role: 'user',
      text: `Go back to: ${STEP_LABELS[targetQId] || targetQId}`,
    }, {
      id: `ai-goback-${Date.now()}`,
      role: 'ai',
      text: `Sure! Let's update that. Current value: **${currentValue || '(not set)'}**`,
    }]);

    advanceToQuestion(targetQId, collectedDataRef.current);
  }, [advanceToQuestion]);

  // ── Return values ───────────────────────────────────────────────────────────

  return {
    messages,
    input,
    setInput,
    isTyping,
    isLoading,
    currentQuestionId,
    collectedData,
    messagesEndRef,
    handleSend,
    isFormDisabled: isFormQuestion(currentQuestionId),
    answerHistory,
    returnToQuestionId,
    completedSteps,
    goBackToStep,
  };
}
