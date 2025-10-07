import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

type ToastType = 'success' | 'info' | 'error';

type ShowOptions = {
  title: string;
  message?: string;
  type?: ToastType;
  durationMs?: number; // default 2400
};

type ToastContextType = {
  show: (opts: ShowOptions) => void;
  hide: () => void;
  setTopOffset: (px: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<Required<ShowOptions>>({
    title: '',
    message: '',
    type: 'success',
    durationMs: 2400,
  });
  const [topOffset, setTopOffset] = useState<number>(Platform.select({ ios: 20, android: 16, default: 16 })!);

  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateIn = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (onEnd?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -30,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onEnd && onEnd();
    });
  };

  const show: ToastContextType['show'] = (opts) => {
    // Clear any running hide timer
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    const next: Required<ShowOptions> = {
      title: opts.title,
      message: opts.message ?? '',
      type: opts.type ?? 'success',
      durationMs: opts.durationMs ?? 2400,
    };
    setContent(next);

    // If already visible, restart animation from hidden state quickly
    translateY.setValue(-30);
    opacity.setValue(0);
    animateIn();

    hideTimer.current = setTimeout(() => {
      animateOut();
      hideTimer.current = null;
    }, next.durationMs);
  };

  const hide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (visible) animateOut();
  };

  const value = useMemo(() => ({ show, hide, setTopOffset }), []);

  const scheme = getSchemeColors(colors, content.type);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {visible && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateY }],
                opacity,
                top: topOffset,
              },
            ]}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: scheme.bg,
                  shadowColor: scheme.shadow,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: scheme.iconBg }]}>
                <Feather name={iconForType(content.type)} size={18} color={scheme.icon} />
              </View>
              <View style={styles.texts}>
                <Text style={[styles.title, { color: scheme.fg }]} numberOfLines={1}>
                  {content.title}
                </Text>
                {!!content.message && (
                  <Text style={[styles.message, { color: scheme.fgMuted }]} numberOfLines={1}>
                    {content.message}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

function iconForType(type: ToastType) {
  switch (type) {
    case 'success':
      return 'check-circle';
    case 'error':
      return 'x-circle';
    default:
      return 'info';
  }
}

function getSchemeColors(colors: ReturnType<typeof useTheme>['colors'], type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bg: '#E6F4EA',
        fg: '#1B5E20',
        fgMuted: '#2E7D32',
        icon: '#2E7D32',
        iconBg: '#C8E6C9',
        shadow: '#2E7D32',
      };
    case 'error':
      return {
        bg: '#FDECEA',
        fg: '#B71C1C',
        fgMuted: '#D32F2F',
        icon: '#D32F2F',
        iconBg: '#FFCDD2',
        shadow: '#B71C1C',
      };
    case 'info':
    default:
      return {
        bg: '#E3F2FD',
        fg: '#0D47A1',
        fgMuted: '#1565C0',
        icon: '#1565C0',
        iconBg: '#BBDEFB',
        shadow: '#0D47A1',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    width: '94%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  texts: {
    flexShrink: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    marginTop: 2,
  },
});
