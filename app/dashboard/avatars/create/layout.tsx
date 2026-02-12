import { AvatarCreationProvider } from "@/contexts/AvatarCreationContext";

export default function AvatarCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AvatarCreationProvider>{children}</AvatarCreationProvider>;
}
