import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { hasSupervisorRole, useAuthStore } from "@/stores/auth";
import { toast } from "@/stores/toast";

const LAST_USERNAME_KEY = "prefs.lastUsername";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onChange",
  });

  useEffect(() => {
    AsyncStorage.getItem(LAST_USERNAME_KEY).then((value) => {
      if (value) setValue("username", value);
    });
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const user = await signIn(data.username.trim(), data.password);
      await AsyncStorage.setItem(LAST_USERNAME_KEY, data.username.trim());
      if (!hasSupervisorRole(user)) {
        useAuthStore.getState().reset();
        toast.error("Tu cuenta no tiene rol SUPERVISOR. Contacta a tu administrador.");
        return;
      }
      toast.success(`Bienvenido, ${user.firstName || user.username}`);
      router.replace("/(app)");
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.response?.status === 401) {
          toast.error("Usuario o contraseña incorrectos.");
        } else if (e.response?.status === 429) {
          toast.error("Demasiados intentos. Espera un momento antes de reintentar.");
        } else if (e.code === "ERR_NETWORK") {
          toast.error("Sin conexión al servidor.");
        } else {
          toast.error("No se pudo iniciar sesión. Intenta de nuevo.");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-primary">MMQEP</Text>
            <Text className="text-base text-texto-secundario mt-1">Toma de Precios</Text>
          </View>

          <View className="gap-4">
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Usuario"
                  placeholder="usuario.apellido"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  error={errors.username?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Contraseña"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secure
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  error={errors.password?.message}
                />
              )}
            />

            <Button
              label="Iniciar sesión"
              loading={submitting}
              disabled={!isValid || submitting}
              onPress={handleSubmit(onSubmit)}
            />

            <Text
              className="text-center text-xs text-texto-secundario mt-2"
              onPress={() =>
                toast.info("Contacta a tu administrador para recuperar tu contraseña.")
              }
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
