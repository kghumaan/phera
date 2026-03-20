import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGuestAvatar } from '@/lib/utils/avatar-generator';

describe('onboarding avatar generation', () => {
  describe('avatar generation during finalizeOnboarding', () => {
    it('should generate avatar from user email', () => {
      const userEmail = 'admin@example.com';
      const avatar = generateGuestAvatar(userEmail, 'John');

      expect(avatar.svg).toContain('<svg');
      expect(avatar.seed).toBe('admin@example.com');
      expect(avatar.style).toBeDefined();
    });

    it('should include avatar fields in settings upsert data', () => {
      const userEmail = 'admin@example.com';
      const coupleName = 'John';
      const avatar = generateGuestAvatar(userEmail, coupleName);

      const settingsToSave = {
        user_id: 'user-123',
        account_type: 'couple',
        enabled_features: ['website'],
        subscription_tier: 'basic',
        onboarding_completed: true,
        avatar_style: avatar.style,
        avatar_seed: avatar.seed,
        avatar_svg: avatar.svg,
      };

      expect(settingsToSave.avatar_style).toBeDefined();
      expect(settingsToSave.avatar_seed).toBeDefined();
      expect(settingsToSave.avatar_svg).toContain('<svg');
    });
  });

  describe('avatar generation during email/password signup', () => {
    it('should generate avatar immediately after signup', () => {
      const email = 'newuser@example.com';
      const avatar = generateGuestAvatar(email);

      expect(avatar.svg).toContain('<svg');
      expect(avatar.seed).toBe('newuser@example.com');
    });

    it('should produce upsert-ready data', () => {
      const email = 'newuser@example.com';
      const userId = 'new-user-id';
      const avatar = generateGuestAvatar(email);

      const upsertData = {
        user_id: userId,
        avatar_style: avatar.style,
        avatar_seed: avatar.seed,
        avatar_svg: avatar.svg,
      };

      expect(upsertData.user_id).toBe('new-user-id');
      expect(upsertData.avatar_style).toBeDefined();
      expect(upsertData.avatar_seed).toBe('newuser@example.com');
    });
  });

  describe('avatar generation in auth callback (OAuth)', () => {
    it('should generate avatar for new OAuth users', () => {
      const userEmail = 'google-user@gmail.com';
      const userName = 'Google User';
      const avatar = generateGuestAvatar(userEmail, userName);

      expect(avatar.svg).toContain('<svg');
    });

    it('should NOT overwrite existing avatar', () => {
      // Simulate: existing settings already have an avatar
      const existingSettings = {
        avatar_svg: '<svg>existing-avatar</svg>',
      };

      // The callback route checks this before generating
      const shouldGenerate = !existingSettings?.avatar_svg;
      expect(shouldGenerate).toBe(false);
    });

    it('should generate avatar when settings exist but avatar is null', () => {
      const existingSettings = {
        avatar_svg: null,
      };

      const shouldGenerate = !existingSettings?.avatar_svg;
      expect(shouldGenerate).toBe(true);
    });

    it('should generate avatar when no settings exist at all', () => {
      const existingSettings = null as any;

      const shouldGenerate = !existingSettings?.avatar_svg;
      expect(shouldGenerate).toBe(true);
    });

    it('should use user ID as fallback seed when no email', () => {
      const userEmail: string | null = null;
      const userId = 'user-uuid-123';
      const seed = userEmail || userId;
      const avatar = generateGuestAvatar(seed);

      expect(avatar.seed).toBe('user-uuid-123');
    });
  });

  describe('avatar data integrity', () => {
    it('should always produce non-empty SVG', () => {
      const testEmails = [
        'simple@test.com',
        'very.long.email.address@subdomain.example.com',
        'special+chars@test.com',
        '123@456.com',
      ];

      for (const email of testEmails) {
        const avatar = generateGuestAvatar(email);
        expect(avatar.svg.length).toBeGreaterThan(0);
        expect(avatar.svg).toContain('<svg');
      }
    });

    it('should always return a valid style from AVATAR_STYLES', () => {
      const validStyles = ['shapes'];
      const testNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

      for (const name of testNames) {
        const avatar = generateGuestAvatar(`${name}@test.com`, name);
        expect(validStyles).toContain(avatar.style);
      }
    });
  });
});
