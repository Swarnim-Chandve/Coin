"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";

export function Providers(props: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "auto",
          theme: "mini-app-theme",
          name: "Remind",
          logo: process.env.NEXT_PUBLIC_ICON_URL,
          accentColor: "#6366F1",
          borderRadius: "0.75rem",
        },
        connect: {
          showBalance: true,
          showProfileImage: true,
        },
        notifications: {
          enabled: true,
          defaultDuration: 3000,
        },
      }}
    >
      {props.children}
    </MiniKitProvider>
  );
}
