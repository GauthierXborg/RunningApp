import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ChipSelectorProps {
  options: { label: string; value: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
  multi?: boolean;
  selectedValues?: string[];
  onMultiSelect?: (values: string[]) => void;
}

export function ChipSelector({
  options,
  selected,
  onSelect,
  multi,
  selectedValues = [],
  onMultiSelect,
}: ChipSelectorProps) {
  const handlePress = (value: string) => {
    if (multi && onMultiSelect) {
      if (selectedValues.includes(value)) {
        onMultiSelect(selectedValues.filter((v) => v !== value));
      } else {
        onMultiSelect([...selectedValues, value]);
      }
    } else {
      onSelect(value);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = multi
          ? selectedValues.includes(option.value)
          : selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => handlePress(option.value)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
});
