import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface TimeInputProps {
  minutes: string;
  seconds: string;
  onChangeMinutes: (value: string) => void;
  onChangeSeconds: (value: string) => void;
}

export function TimeInput({
  minutes,
  seconds,
  onChangeMinutes,
  onChangeSeconds,
}: TimeInputProps) {
  return (
    <View className="flex-row items-center" style={styles.gap}>
      <View className="items-center">
        <TextInput
          className="bg-surface rounded-2xl border-[1.5px] border-divider text-textPrimary text-center font-bold"
          style={styles.input}
          value={minutes}
          onChangeText={onChangeMinutes}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={Colors.textMuted}
        />
        <Text className="text-[13px] font-medium text-textMuted mt-1.5">min</Text>
      </View>
      <Text className="text-[28px] font-bold text-textMuted" style={styles.separator}>:</Text>
      <View className="items-center">
        <TextInput
          className="bg-surface rounded-2xl border-[1.5px] border-divider text-textPrimary text-center font-bold"
          style={styles.input}
          value={seconds}
          onChangeText={onChangeSeconds}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={Colors.textMuted}
        />
        <Text className="text-[13px] font-medium text-textMuted mt-1.5">sec</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 12,
  },
  input: {
    fontSize: 28,
    width: 80,
    height: 64,
    paddingHorizontal: 8,
  },
  separator: {
    marginBottom: 22,
  },
});
