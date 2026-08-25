import type {ReactNode} from "react";

export default function RedirectRootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
