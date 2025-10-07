import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

export default function LockScreen() {
  const { colors } = useTheme();
  const { unlock, attemptsLeft, blocked } = useAuth();
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (submitting || blocked) return;
    setSubmitting(true);
    setError('');
    const ok = await unlock(pwd);
    if (!ok) {
      setError('Incorrect password');
      setPwd('');
    }
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: '#4A5D3F' }]}>Secure Sign In</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter the password to access BookCenter.</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={pwd}
            onChangeText={setPwd}
            placeholder="Password (includes underscores _)"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPwd}
            style={[styles.input, { borderColor: '#4A5D3F', color: colors.text }]}
            editable={!blocked}
            onSubmitEditing={onSubmit}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
            keyboardType={Platform.OS === 'android' ? 'visible-password' as any : 'default'}
          />
          <TouchableOpacity accessibilityRole="button" onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
            <Feather name={showPwd ? 'eye-off' : 'eye'} size={20} color={'#4A5D3F'} />
          </TouchableOpacity>
        </View>
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        {!blocked ? (
          <Text style={[styles.attempts, { color: colors.textSecondary }]}>Attempts left: {attemptsLeft}</Text>
        ) : (
          <Text style={[styles.blocked, { color: colors.error }]}>Too many wrong attempts. App will close.</Text>
        )}
        <TouchableOpacity onPress={onSubmit} disabled={submitting || blocked} style={[styles.button, { backgroundColor: '#4A5D3F', opacity: submitting || blocked ? 0.7 : 1 }]}>
          <Text style={styles.buttonText}>{submitting ? 'Checking…' : 'Unlock'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, borderWidth: 2, borderColor: '#4A5D3F', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  inputWrap: { width: '100%', position: 'relative', marginBottom: 10 },
  input: { width: '100%', borderWidth: 2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 10, top: 10, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, marginBottom: 6 },
  attempts: { fontSize: 12, marginBottom: 12 },
  blocked: { fontSize: 13, marginBottom: 12, fontWeight: '600' },
  button: { width: '100%', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
