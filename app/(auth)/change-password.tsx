import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import * as authApi from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/schemas/auth";
import { toast } from "@/stores/toast";
import { colors } from "@/theme/colors";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: "", new_password: "", confirm_password: "" },
    mode: "onChange",
  });

  const newPasswordValue = watch("new_password");

  const onSubmit = async (data: ChangePasswordFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      toast.success("Contraseña actualizada");
      router.back();
    } catch (e) {
      if (isAxiosError(e)) {
        const detail = (e.response?.data as { detail?: string } | undefined)?.detail;
        if (e.response?.status === 400) {
          toast.error(detail ?? "Contraseña actual incorrecta o nueva no válida.");
        } else {
          toast.error(detail ?? "No se pudo actualizar la contraseña.");
        }
      } else {
        toast.error("Error inesperado. Intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
        <Button
          label="Atrás"
          variant="ghost"
          size="sm"
          fullWidth={false}
          leftIcon={<ChevronLeft size={16} color={colors.primary} />}
          onPress={() => router.back()}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-2xl font-bold text-texto-principal mb-1">
            Cambiar contraseña
          </Text>
          <Text className="text-sm text-texto-secundario mb-6">
            Usa una contraseña segura. Mínimo 8 caracteres.
          </Text>

          <View className="gap-4">
            <Controller
              control={control}
              name="old_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Contraseña actual"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secure
                  error={errors.old_password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="new_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Input
                    label="Nueva contraseña"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secure
                    error={errors.new_password?.message}
                  />
                  <PasswordStrengthMeter password={value} />
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar nueva contraseña"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secure
                  error={errors.confirm_password?.message}
                />
              )}
            />

            <Button
              label="Guardar"
              loading={submitting}
              disabled={!isValid || submitting || !newPasswordValue}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
