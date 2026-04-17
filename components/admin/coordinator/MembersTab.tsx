'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, CircularProgress, alpha, Select, MenuItem } from '@mui/material';
import { AdminPanelSettings, Person, Storefront } from '@mui/icons-material';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface Member {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  is_whatsapp_admin: boolean;
  avatar_url: string | null;
}

const ROLE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  vendor: { color: COLORS.side.both, icon: <Storefront sx={{ fontSize: 14 }} />, label: 'Vendor' },
  admin: { color: COLORS.accent.info, icon: <AdminPanelSettings sx={{ fontSize: 14 }} />, label: 'Admin' },
  member: { color: COLORS.text.faint, icon: <Person sx={{ fontSize: 14 }} />, label: 'Member' },
};

interface MembersTabProps {
  conversationId: string;
  weddingId: string;
}

export default function MembersTab({ conversationId, weddingId }: MembersTabProps) {
  const { showStatus } = useAutoSaveStatus();
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

  const handleRoleChange = async (member: Member, nextRole: string) => {
    if (nextRole === member.role) return;
    const previousRole = member.role;

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
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed');
      }
    } catch (err: any) {
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: previousRole } : m))
      );
      showStatus('error', err?.message || 'Failed to update role');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  if (members.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: COLORS.text.faint, fontSize: '0.85rem' }}>
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
              '&:hover': { bgcolor: alpha(COLORS.text.strong, 0.02) },
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
                  color: COLORS.text.strong,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {member.name || member.phone}
                {member.is_whatsapp_admin && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.7rem', color: COLORS.text.faint, ml: 0.5, fontWeight: 400 }}
                  >
                    (WA admin)
                  </Typography>
                )}
              </Typography>
              {member.name && (
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: COLORS.text.subtle }}>
                  {member.phone}
                </Typography>
              )}
            </Box>

            {/* Role select — dropdown, no race-condition cycling */}
            <Select
              value={member.role}
              onChange={(e) => handleRoleChange(member, e.target.value as string)}
              size="small"
              sx={{
                minWidth: 120,
                height: 32,
                fontSize: '0.78rem',
                fontWeight: 600,
                bgcolor: alpha(config.color, 0.08),
                color: config.color,
                borderRadius: RADII.sm,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(config.color, 0.25) },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(config.color, 0.5) },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: config.color },
                '& .MuiSelect-select': { py: 0.5, pl: 1.25, display: 'flex', alignItems: 'center', gap: 0.75 },
                '& .MuiSvgIcon-root': { color: config.color },
              }}
              renderValue={(value) => {
                const cfg = ROLE_CONFIG[value as string] || ROLE_CONFIG.member;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </Box>
                );
              }}
            >
              {Object.entries(ROLE_CONFIG).map(([value, cfg]) => (
                <MenuItem key={value} value={value} sx={{ fontSize: '0.82rem', gap: 0.75 }}>
                  <Box component="span" sx={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>
                    {cfg.icon}
                  </Box>
                  {cfg.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        );
      })}
    </Stack>
  );
}
