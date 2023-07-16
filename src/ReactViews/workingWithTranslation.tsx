import { i18n } from "i18next";
import React from "react";
import { useTranslation, TFunction } from "react-i18next";

// The normal withTranslation causes TypeScript to generate an invalid .d.ts file, for unknown reasons.
export default function workingWithTranslation<
  Props extends { t?: TFunction; i18n?: i18n }
>(
  WrappedComponent: React.ComponentType<Props>
): React.FC<Omit<Props, "t" | "i18n">> {
  const WorkingWithTranslation: React.FC<Omit<Props, "t" | "i18n">> = (
    props: Omit<Props, "t" | "i18n">
  ) => {
    const { t, i18n } = useTranslation();
    return <WrappedComponent {...(props as Props)} t={t} i18n={i18n} />;
  };
  return WorkingWithTranslation;
}
