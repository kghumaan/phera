'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Chip, CircularProgress, alpha } from '@mui/material';
import { AdminPanelSettings, Person, Storefront } from '@mui/icons-material';
import { toast } from 'sonner';

interface Member {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  is_whatsapp_admin: boolean;
  avatar_url: string | null;
}

const ROLE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  vendor: { color: '#9C27B0', icon: <Storefront sx={{ fontSize: 12 }} />, label: 'Vendor' },
  admin: { color: '#2196F3', icon: <AdminPanelSettings sx={{ fontSize: 12 }} />, label: 'Admin' },
  member: { color: '#9E9E9E', icon: <Person sx={{ fontSize: 12 }} />, label: 'Member' },
};

const ROLE_CYCLE = ['member', 'vendor', 'admin'];

interface MembersTabProps {
  conversationId: string;
  weddingId: string;
}

export default function MembersTab({ conversationId, weddingId }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors/conversations/${conversationId}/members`);
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCycleRole = async (member: Member) => {
    const currentIdx = ROLE_CYCLE.indexOf(member.role);
    const nextRole = ROLE_CYCLE[(currentIdx + 1) % ROLE_CYCLE.length];

    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m))
    );

    try {
      const res = await fetch(`/api/vendors/conversations/${conversationId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, role: nextRole }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
    } catch {
      // Revert
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: member.role } : m))
      );
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  if (members.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#888', fontSize: '0.85rem' }}>
          No members found for this conversation.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0.5} sx={{ py: 1 }}>
      {members.map((member) => {
        const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
        const displayName = member.name || member.phone;
        const initial = (displayName[0] || '?').toUpperCase();

        return (
          <Box
            key={member.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              borderRadius: 1,
              '&:hover': { bgcolor: alpha('#000', 0.02) },
            }}
          >
            {/* Avatar circle */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: alpha(config.color, 0.12),
                color: config.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {initial}
            </Box>

            {/* Name + phone */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {member.name || member.phone}
                {member.is_whatsapp_admin && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.7rem', color: '#999', ml: 0.5, fontWeight: 400 }}
                  >
                    (WA admin)
                  </Typography>
                )}
              </Typography>
              {member.name && (
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#6a6a6a' }}>
                  {member.phone}
                </Typography>
              )}
            </Box>

            {/* Role badge — click to cycle */}
            <Chip
              icon={config.icon as React.ReactElement}
              label={config.label}
              size="small"
              onClick={() => handleCycleRole(member)}
              sx={{
                fontSize: '0.7rem',
                height: 24,
                borderRadius: '6px',
                bgcolor: alpha(config.color, 0.1),
                color: config.color,
                fontWeight: 600,
                cursor: 'pointer',
                '& .MuiChip-icon': { color: config.color },
                '&:hover': { bgcolor: alpha(config.color, 0.18) },
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
