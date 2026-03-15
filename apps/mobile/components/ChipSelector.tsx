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
    <View className="flex-row flex-wrap" style={styles.gap}>
      {options.map((option) => {
        const isSelected = multi
          ? selectedValues.includes(option.value)
          : selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            className={`px-[22px] py-3 rounded-full border-[1.5px] ${
              isSelected
                ? 'bg-accent border-accent'
                : 'bg-surface border-divider'
            }`}
            onPress={() => handlePress(option.value)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-[15px] ${
                isSelected
                  ? 'text-bg font-semibold'
                  : 'text-textSecondary font-medium'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: 10,
  },
});
