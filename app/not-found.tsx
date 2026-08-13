import type {Metadata} from "next";

import {Link} from "@/i18n/navigation";
import messages from "@/messages/tr.json";

const notFoundMessages = messages.NotFound;

export const metadata: Metadata = {
  title: notFoundMessages.title,
  description: notFoundMessages.description,
  robots: {
    index: false,
    follow: false,
  },
};

export default function GlobalNotFound() {
  return (
    <html lang="tr" dir="ltr">
      <body>
        <main>
          <p>404</p>
          <h1>{notFoundMessages.title}</h1>
          <p>{notFoundMessages.description}</p>
          <Link href="/" locale="tr">
            {notFoundMessages.backToHome}
          </Link>
        </main>
      </body>
    </html>
  );
}
