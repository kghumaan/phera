'use client';

import React from 'react';
import { Box, Button } from '@mui/material';
import { QuestionId, FormType } from './types';
import { QUESTIONS } from './question-flow';
import ChatEventForm from '@/components/admin/build-ai/ChatEventForm';
import ChatDateForm from '@/components/admin/build-ai/ChatDateForm';
import ChatFAQForm from '@/components/admin/build-ai/ChatFAQForm';
import ChatRegistryForm from '@/components/admin/build-ai/ChatRegistryForm';
import ChatCountPicker from '@/components/admin/build-ai/ChatCountPicker';
import ChatTravelForm from '@/components/admin/build-ai/ChatTravelForm';
import ChatShoppingForm from '@/components/admin/build-ai/ChatShoppingForm';
import ChatPinForm from '@/components/admin/build-ai/ChatPinForm';
import ChatLookFeelForm from '@/components/admin/build-ai/ChatLookFeelForm';

// ─── Shared Button Styles ────────────────────────────────────────────────────

const outlinedBtnSx = {
  borderRadius: '16px',
  borderColor: '#DE3F5E',
  color: '#DE3F5E',
  fontSize: '0.85rem',
  fontWeight: 700,
  py: 1,
  px: 2,
  textTransform: 'none' as const,
  whiteSpace: 'nowrap' as const,
  flex: 1,
  border: '2px solid',
  '&:hover': { border: '2px solid', borderColor: '#c73552', bgcolor: 'rgba(222, 63, 94, 0.04)' }
};

const containedBtnSx = {
  bgcolor: '#DE3F5E',
  color: 'white',
  borderRadius: '16px',
  fontSize: '0.85rem',
  fontWeight: 700,
  py: 1,
  px: 2,
  textTransform: 'none' as const,
  whiteSpace: 'nowrap' as const,
  flex: 1,
  '&:hover': { bgcolor: '#c73552' }
};

// ─── Form Component Handlers ─────────────────────────────────────────────────

export interface FormRenderHandlers {
  onEventFormSave: (eventData: any, qId: QuestionId) => void;
  onEventFormCancel: (qId: QuestionId) => void;
  onDateFormSave: (date: Date | null, formatted: string, qId: QuestionId) => void;
  onDateFormSkip: (qId: QuestionId) => void;
  onFAQFormSave: (faqData: any) => void;
  onFAQFormCancel: () => void;
  onRegistryFormSave: (regData: any) => void;
  onRegistryFormCancel: () => void;
  onTravelFormSave: (travelData: any) => void;
  onTravelFormCancel: () => void;
  onShoppingFormSave: (shopData: any) => void;
  onShoppingFormCancel: () => void;
  onPinFormSave: (pinData: any) => void;
  onPinFormCancel: () => void;
  onLookFeelSave: (designData: Record<string, any>) => void;
  onLookFeelCancel: () => void;
  onCountChange: (val: number) => void;
  onQuickReply: (text: string) => void;
  collectedData: Record<string, any>;
  weddingId: string | null;
}

// ─── Render Form Component ──────────────────────────────────────────────────

export function renderFormComponent(
  questionId: QuestionId,
  handlers: FormRenderHandlers
): React.ReactNode | null {
  const question = QUESTIONS[questionId];
  if (!question) return null;

  const { formType } = question;

  switch (formType) {
    case 'event':
      return (
        <ChatEventForm
          onSave={(eventData) => handlers.onEventFormSave(eventData, questionId)}
          onCancel={() => handlers.onEventFormCancel(questionId)}
        />
      );

    case 'date':
      if (questionId === 'rsvp_deadline') {
        return (
          <ChatDateForm
            label="RSVP Deadline"
            onSave={(date, formatted) => handlers.onDateFormSave(date, formatted, 'rsvp_deadline')}
            onSkip={() => handlers.onDateFormSkip('rsvp_deadline')}
            skipLabel="No Deadline"
            minDate={new Date()}
          />
        );
      }
      return null;

    case 'faq':
      return (
        <ChatFAQForm
          onSave={(faqData) => handlers.onFAQFormSave(faqData)}
          onCancel={() => handlers.onFAQFormCancel()}
        />
      );

    case 'registry':
      return (
        <ChatRegistryForm
          onSave={(regData) => handlers.onRegistryFormSave(regData)}
          onCancel={() => handlers.onRegistryFormCancel()}
        />
      );

    case 'travel':
      return (
        <ChatTravelForm
          onSave={(travelData) => handlers.onTravelFormSave(travelData)}
          onCancel={() => handlers.onTravelFormCancel()}
        />
      );

    case 'shopping':
      return (
        <ChatShoppingForm
          onSave={(shopData) => handlers.onShoppingFormSave(shopData)}
          onCancel={() => handlers.onShoppingFormCancel()}
        />
      );

    case 'pin':
      return (
        <ChatPinForm
          onSave={(pinData) => handlers.onPinFormSave(pinData)}
          onCancel={() => handlers.onPinFormCancel()}
          weddingId={handlers.weddingId}
        />
      );

    case 'look_feel':
      return (
        <ChatLookFeelForm
          onSave={(designData) => handlers.onLookFeelSave(designData)}
          onCancel={() => handlers.onLookFeelCancel()}
          currentValues={handlers.collectedData}
        />
      );

    case 'count':
      return (
        <ChatCountPicker
          value={1}
          min={1}
          max={10}
          onChange={(val) => handlers.onCountChange(val)}
        />
      );

    case 'yes_no': {
      return (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%', maxWidth: 480 }}>
          <Button variant="outlined" fullWidth sx={outlinedBtnSx} onClick={() => handlers.onQuickReply('no')}>
            Skip
          </Button>
          <Button variant="contained" fullWidth sx={containedBtnSx} onClick={() => handlers.onQuickReply('yes')}>
            Yes
          </Button>
        </Box>
      );
    }

    case 'skip_button':
      return (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%', maxWidth: 240 }}>
          <Button variant="outlined" fullWidth sx={outlinedBtnSx} onClick={() => handlers.onQuickReply('skip')}>
            Skip for now
          </Button>
        </Box>
      );

    case 'text':
    case 'none':
    default:
      return null;
  }
}

// ─── Add-Another prompt for repeatable items ─────────────────────────────────

export function renderAddAnotherPrompt(
  onAddAnother: () => void,
  onDone: () => void,
  doneLabel: string
): React.ReactNode {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%', maxWidth: 480 }}>
      <Button variant="outlined" size="small" fullWidth sx={outlinedBtnSx} onClick={onAddAnother}>
        Add Another
      </Button>
      <Button variant="contained" size="small" fullWidth sx={containedBtnSx} onClick={onDone}>
        {doneLabel}
      </Button>
    </Box>
  );
}
