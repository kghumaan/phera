import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraButton,
  PheraCard,
  PheraChip,
  PheraSheet,
  PheraText,
} from '@/components/ui';
import { useMoveTask, useTasks, useWedding } from '@/lib/data/hooks';
import type { TaskColumn, WeddingTask } from '@/lib/data/types';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const COLUMNS: { key: TaskColumn; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
];

export default function TasksScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const wedding = useWedding(weddingSlug);
  const tasks = useTasks(wedding.data?.id);
  const moveTask = useMoveTask(wedding.data?.id);

  const [column, setColumn] = useState<TaskColumn>('todo');
  const [selected, setSelected] = useState<WeddingTask | null>(null);

  const all = tasks.data ?? [];
  const inColumn = all.filter((t) => t.column === column);

  const move = async (to: TaskColumn) => {
    if (!selected) return;
    await moveTask.mutateAsync({ id: selected.id, column: to });
    setSelected(null);
  };

  return (
    <Screen onRefresh={() => tasks.refetch()} refreshing={tasks.isRefetching}>
      <PageHeading
        title="Tasks"
        subtitle={`${all.filter((t) => t.column !== 'done').length} open`}
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {COLUMNS.map((c) => {
          const count = all.filter((t) => t.column === c.key).length;
          const active = column === c.key;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="button"
              accessibilityLabel={`column-${c.key}`}
              onPress={() => setColumn(c.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: RADII.md,
                alignItems: 'center',
                backgroundColor: active ? COLORS.brand.primary : COLORS.bg.white,
                borderWidth: 1,
                borderColor: active ? COLORS.brand.primary : COLORS.border.default,
              }}
            >
              <PheraText
                variant="body2"
                weight={600}
                color={active ? COLORS.text.inverse : COLORS.text.muted}
              >
                {c.label} ({count})
              </PheraText>
            </Pressable>
          );
        })}
      </View>

      {inColumn.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title={column === 'done' ? 'Nothing finished yet' : 'No tasks here'}
          subtitle="The Planner adds tasks as you chat — or create them on the web board."
        />
      ) : (
        inColumn.map((t) => (
          <PheraCard
            key={t.id}
            accessibilityLabel={`Open task ${t.title}`}
            onPress={() => setSelected(t)}
          >
            <View style={{ gap: 6 }}>
              <PheraText variant="body" weight={500}>
                {t.title}
              </PheraText>
              {t.description ? <PheraText variant="body2">{t.description}</PheraText> : null}
              {t.tags?.length ? (
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {t.tags.map((tag) => (
                    <PheraChip key={tag} label={tag} tone="neutral" />
                  ))}
                </View>
              ) : null}
            </View>
          </PheraCard>
        ))
      )}

      <PheraSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ''}>
        <View style={{ gap: 10, paddingBottom: 8 }}>
          {selected?.description ? (
            <PheraText variant="body2">{selected.description}</PheraText>
          ) : null}
          <PheraText variant="label">Move to</PheraText>
          {COLUMNS.filter((c) => c.key !== selected?.column).map((c) => (
            <PheraButton
              key={c.key}
              variant="secondary"
              fullWidth
              loading={moveTask.isPending}
              onPress={() => move(c.key)}
            >
              {c.label}
            </PheraButton>
          ))}
        </View>
      </PheraSheet>
    </Screen>
  );
}
