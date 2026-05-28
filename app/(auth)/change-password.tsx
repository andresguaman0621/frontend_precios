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
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { PressableScale } from "@/components/ui/PressableScale";
import { useResponsive } from "@/hooks/useResponsive";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/schemas/auth";
import { toast } from "@/stores/toast";
import { colors } from "@/theme/colors";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
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
      <View className="flex-row items-center px-3 py-2.5 border-b border-gray-200">
        <PressableScale
          onPress={() => router.back()}
          className="flex-row items-center gap-1 px-2 py-1.5 -ml-1"
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text className="text-primary font-medium text-sm">Atrás</Text>
        </PressableScale>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 100,
            alignItems: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: "100%", maxWidth: isTablet ? 480 : 560 }} className="gap-4">
            <View>
              <Text className="text-2xl font-semibold text-texto-principal">
                Cambiar contraseña
              </Text>
              <Text className="text-sm text-texto-secundario mt-1">
                Usa una contraseña segura. Mínimo 8 caracteres.
              </Text>
            </View>

            <Card>
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
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
