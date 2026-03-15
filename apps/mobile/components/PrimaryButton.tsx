import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      className={`rounded-2xl py-[18px] items-center justify-center w-full ${
        isPrimary ? 'bg-accent' : 'bg-surface border-[1.5px] border-divider'
      } ${disabled ? 'opacity-40' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.background : Colors.primary} />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Feather
              name={icon}
              size={18}
              color={isPrimary ? Colors.background : Colors.text}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className={`text-[17px] font-semibold tracking-wide ${
              isPrimary ? 'text-bg' : 'text-textPrimary'
            }`}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
