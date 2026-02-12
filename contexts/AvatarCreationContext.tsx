"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AvatarCreationContextType {
  mainVideoFile: File | null;
  mainVideoUrl: string;
  mainVideoFileName: string;
  mainVideoDuration: string;
  mainVideoSize: string;
  consentVideoBlob: Blob | null;
  consentVideoUrl: string;
  consentDuration: string;
  consentSize: string;
  userName: string;
  setMainVideo: (file: File, duration: string, size: string) => void;
  clearMainVideo: () => void;
  setConsentVideo: (blob: Blob, duration: string, size: string) => void;
  setUserName: (name: string) => void;
  reset: () => void;
}

const AvatarCreationContext = createContext<AvatarCreationContextType | undefined>(undefined);

export function AvatarCreationProvider({ children }: { children: ReactNode }) {
  const [mainVideoFile, setMainVideoFile] = useState<File | null>(null);
  const [mainVideoUrl, setMainVideoUrl] = useState("");
  const [mainVideoFileName, setMainVideoFileName] = useState("");
  const [mainVideoDuration, setMainVideoDuration] = useState("");
  const [mainVideoSize, setMainVideoSize] = useState("");

  const [consentVideoBlob, setConsentVideoBlob] = useState<Blob | null>(null);
  const [consentVideoUrl, setConsentVideoUrl] = useState("");
  const [consentDuration, setConsentDuration] = useState("");
  const [consentSize, setConsentSize] = useState("");

  const [userName, setUserNameState] = useState("");

  const setMainVideo = useCallback((file: File, duration: string, size: string) => {
    setMainVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setMainVideoFile(file);
    setMainVideoFileName(file.name);
    setMainVideoDuration(duration);
    setMainVideoSize(size);
  }, []);

  const clearMainVideo = useCallback(() => {
    setMainVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setMainVideoFile(null);
    setMainVideoFileName("");
    setMainVideoDuration("");
    setMainVideoSize("");
  }, []);

  const setConsentVideo = useCallback((blob: Blob, duration: string, size: string) => {
    setConsentVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setConsentVideoBlob(blob);
    setConsentDuration(duration);
    setConsentSize(size);
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
  }, []);

  const reset = useCallback(() => {
    setMainVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setConsentVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setMainVideoFile(null);
    setMainVideoFileName("");
    setMainVideoDuration("");
    setMainVideoSize("");
    setConsentVideoBlob(null);
    setConsentDuration("");
    setConsentSize("");
    setUserNameState("");
  }, []);

  return (
    <AvatarCreationContext.Provider
      value={{
        mainVideoFile,
        mainVideoUrl,
        mainVideoFileName,
        mainVideoDuration,
        mainVideoSize,
        consentVideoBlob,
        consentVideoUrl,
        consentDuration,
        consentSize,
        userName,
        setMainVideo,
        clearMainVideo,
        setConsentVideo,
        setUserName,
        reset,
      }}
    >
      {children}
    </AvatarCreationContext.Provider>
  );
}

export function useAvatarCreation() {
  const context = useContext(AvatarCreationContext);
  if (!context) {
    throw new Error("useAvatarCreation must be used within AvatarCreationProvider");
  }
  return context;
}

/** Use when inside wizard steps that may or may not be wrapped by provider (e.g. optional sync to context). */
export function useOptionalAvatarCreation(): AvatarCreationContextType | undefined {
  return useContext(AvatarCreationContext);
}
