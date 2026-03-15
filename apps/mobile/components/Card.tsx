import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function Card({ children, style, className = '' }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl p-5 border border-divider ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
