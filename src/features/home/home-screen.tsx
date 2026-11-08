import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/ui/brand-mark';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Screen } from '@/ui/screen';
import { Sheet } from '@/ui/sheet';
import { Text } from '@/ui/text';
import { space } from '@/ui/tokens';

/** Fundação (E00): a Início de verdade (docs/telas/C01b) chega na E04. */
export function HomeScreen() {
  const [open, setOpen] = useState(false);
  return (
    <Screen
      footer={
        <Button
          label="O que vem por aí"
          onPress={() => {
            setOpen(true);
          }}
        />
      }
    >
      <View style={styles.content}>
        <BrandMark height={44} />
        <Text variant="display" accessibilityRole="header">
          Nova versão em construção
        </Text>
        <Text color="textMuted">
          O CronôBR está sendo refeito do zero, com contador preciso, rotinas suas e backup entre
          Android e iPhone.
        </Text>
        <Card>
          <Text variant="label">Etapa atual</Text>
          <Text color="textMuted">Fundação: base técnica, testes e prévia web.</Text>
        </Card>
      </View>
      <Sheet
        title="O que vem por aí"
        visible={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        {ROADMAP.map((item) => (
          <Text key={item}>• {item}</Text>
        ))}
      </Sheet>
    </Screen>
  );
}

const ROADMAP = [
  'Contador que não perde tempo, mesmo com a tela bloqueada',
  'Rotinas com etapas, blocos e descansos do seu jeito',
  'Voz, beep e vibração separados',
  'Três jeitos de ver o treino: Foco, Anel e Lista',
  'Backup em arquivo entre Android e iPhone',
] as const;

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingTop: space.xl },
});
