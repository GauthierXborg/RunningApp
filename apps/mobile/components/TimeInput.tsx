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
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={minutes}
          onChangeText={onChangeMinutes}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.label}>min</Text>
      </View>
      <Text style={styles.separator}>:</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={seconds}
          onChangeText={onChangeSeconds}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="00"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.label}>sec</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputGroup: {
    alignItems: 'center',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: 72,
    height: 56,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  separator: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
});
