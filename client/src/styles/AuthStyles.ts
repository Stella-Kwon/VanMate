import { StyleSheet, Platform } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, METRICS } from "../theme";

const baseInputStyle = {
  borderWidth: 1,
  borderColor: COLORS.border,
  padding: Platform.OS === 'web' ? SPACING.md : SPACING.lg,
  borderRadius: METRICS.borderRadius,
  marginBottom: Platform.OS === 'web' ? SPACING.md : SPACING.lg,
  backgroundColor: "#fff",
  color: COLORS.textPrimary,
  fontSize: Platform.OS === 'web' ? undefined : 16,
};

const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: Platform.OS === 'web' ? TYPOGRAPHY.size.xlarge : 32,
    fontWeight: TYPOGRAPHY.weight.bold as "700",
    color: COLORS.textPrimary,
    marginBottom: Platform.OS === 'web' ? SPACING.lg : SPACING.xl,
  },
  input: baseInputStyle,
  link: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: Platform.OS === 'web' ? "50%" : "90%", 
    maxWidth: Platform.OS === 'web' ? 500 : undefined,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: Platform.OS === 'web' ? 20 : 30,
    // mobile only
    ...(Platform.OS !== 'web' && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    }),
    // web only
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
    }),
  },
});

//web only
export const getInputStyle = () => {
  if (Platform.OS === 'web') {
    return {
      ...baseInputStyle,
      outlineStyle: 'none' as const,
      cursor: 'text' as const,
      WebkitAppearance: 'none' as const,
    };
  }
  return baseInputStyle;
};

export default authStyles;
