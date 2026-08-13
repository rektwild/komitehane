"use client";

import { ThemeSwitcher } from "@/components/kibo-ui/theme-switcher";

export const title = "Settings row";

const Example = () => (
  <div className="flex w-full max-w-md items-center justify-between rounded-lg border px-4 py-3">
    <div>
      <p className="text-sm font-medium">Appearance</p>
      <p className="text-sm text-muted-foreground">
        Switch between light, dark, and system themes.
      </p>
    </div>
    <ThemeSwitcher />
  </div>
);

export default Example;
