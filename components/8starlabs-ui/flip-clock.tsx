"use client";

import {cn} from "@/lib/utils";
import {cva, type VariantProps} from "class-variance-authority";
import {
  memo,
  useEffect,
  useState,
  type FC,
  type HTMLAttributes,
  type ReactNode,
} from "react";

const flipUnitVariants = cva(
  "relative subpixel-antialiased perspective-[1000px] rounded-md overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-10 min-w-0 flex-1 text-xl", // Small (Compact UI)
        md: "w-14 min-w-14 h-20 text-5xl", // Medium (Standard sidebar/header)
        lg: "w-17 min-w-17 h-24 text-6xl", // Large (Focus/Hero)
        xl: "w-22 min-w-22 h-32 text-8xl", // Extra Large (Dashboard/Landing)
      },
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background text-foreground",
        muted: "bg-muted text-muted-foreground",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    }
  }
);

interface FlipUnitProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flipUnitVariants> {
  digit: number | string;
}

const commonCardStyle = cn(
  "absolute inset-x-0 h-1/2 overflow-hidden bg-inherit text-inherit",
);

const FlipUnit: FC<FlipUnitProps> = memo(function FlipUnit({
  digit,
  size,
  variant,
  className,
}: FlipUnitProps) {
  const [prevDigit, setPrevDigit] = useState(digit);
  const flipping = digit !== prevDigit;

  useEffect(() => {
    if (digit === prevDigit) return;

    // Wait for the full animation (0.3s top + 0.3s bottom) before resetting.
    const timer = setTimeout(() => {
      setPrevDigit(digit);
    }, 550); // Slightly less than 600ms to ensure smoothness

    return () => clearTimeout(timer);
  }, [digit, prevDigit]);

  return (
    <div className={cn(flipUnitVariants({ size, variant }), className)}>
      {/* 1. Background Top (The NEW digit waiting) */}
      <div className={cn(commonCardStyle, "top-0 rounded-t-lg")}>
        <DigitSpan position="top">{digit}</DigitSpan>
      </div>

      {/* 2. Background Bottom (The OLD digit staying) */}
      <div className={cn(commonCardStyle, "translate-y-full rounded-b-lg")}>
        <DigitSpan position="bottom">{prevDigit}</DigitSpan>
      </div>

      {/* 3. Top Flap (The OLD digit falling down) */}
      <div
        className={cn(
          commonCardStyle,
          "z-20 origin-bottom rounded-t-lg backface-hidden",
          flipping && "animate-flip-top",
        )}
      >
        <DigitSpan position="top">{prevDigit}</DigitSpan>
      </div>

      {/* 4. Bottom Flap (The NEW digit appearing) */}
      <div
        className={cn(
          commonCardStyle,
          "z-10 origin-top translate-y-full rounded-b-lg backface-hidden",
          flipping && "animate-flip-bottom",
        )}
        style={{ transform: "rotateX(90deg)" }}
      >
        <DigitSpan position="bottom">{digit}</DigitSpan>
      </div>

      {/* Center Divider Shadow */}
      <div className="absolute top-1/2 left-0 z-30 h-px w-full -translate-y-1/2 bg-background/50" />
    </div>
  );
});

interface DigitSpanProps {
  children: ReactNode;
  position?: "top" | "bottom";
}

function DigitSpan({ children, position }: DigitSpanProps) {
  return (
    <span
      className={cn(
        "absolute right-0 left-0 flex h-[200%] w-full items-center justify-center",
        // The span should be the full height of the PARENT FlipUnit (200% of the half-card)
        "text-inherit",
      )}
      style={{
        // If it's the top half, align the full span to the top
        // If it's the bottom half, shift the full span up so its bottom half shows
        top: position === "top" ? "0%" : "-100%"
      }}
    >
      {children}
    </span>
  );
}

const flipClockVariants = cva(
  "relative flex items-center justify-center font-mono font-medium",
  {
    variants: {
      size: {
        sm: "gap-0.5 text-xl",
        md: "gap-2 text-5xl",
        lg: "gap-2 text-6xl",
        xl: "gap-3 text-8xl",
      },
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        muted: "",
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    }
  }
);

interface FlipClockProps
  extends VariantProps<typeof flipClockVariants>,
    HTMLAttributes<HTMLDivElement> {
  countdown?: boolean;
  targetDate?: Date;
  showDays?: "auto" | "always" | "never";
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

type FlipClockSize = NonNullable<
  VariantProps<typeof flipClockVariants>["size"]
>;

const heightMap: Record<FlipClockSize, string> = {
  sm: "text-xl",
  md: "text-5xl",
  lg: "text-6xl",
  xl: "text-8xl",
};

const EMPTY_TIME: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function ClockSeparator({ size }: { size?: FlipClockSize }) {
  return (
    <span
      className={cn(
        "shrink-0 text-center -translate-y-[8%]",
        size ? heightMap[size] : heightMap.md,
      )}
    >
      :
    </span>
  );
}

export default function FlipClock({
  countdown = false,
  targetDate,
  size,
  variant,
  showDays = "auto",
  className,
  ...props
}: FlipClockProps) {
  const [time, setTime] = useState<TimeLeft>(EMPTY_TIME);
  const resolvedSize = size ?? "md";
  const resolvedVariant = variant ?? "default";

  useEffect(() => {
    // Run a faster heartbeat (250ms) to catch the second rollover immediately
    const timer = setInterval(() => {
      const nextTime = getTime(countdown, targetDate);

      // Only update state if the seconds actually changed to prevent unnecessary re-renders
      setTime((prev) => {
        if (
          prev.days === nextTime.days &&
          prev.hours === nextTime.hours &&
          prev.seconds === nextTime.seconds &&
          prev.minutes === nextTime.minutes
        ) {
          return prev;
        }
        return nextTime;
      });
    }, 250); // 4fps check is plenty

    return () => clearInterval(timer);
  }, [countdown, targetDate]);

  const daysStr = String(time.days).padStart(3, "0");
  const hoursStr = String(time.hours).padStart(2, "0");
  const minutesStr = String(time.minutes).padStart(2, "0");
  const secondsStr = String(time.seconds).padStart(2, "0");

  const shouldShowDays =
    countdown &&
    (showDays === "always" || (showDays === "auto" && time.days > 0));

  return (
    <div
      className={cn(
        flipClockVariants({size: resolvedSize, variant: resolvedVariant}),
        className,
      )}
      aria-live="polite"
      {...props}
    >
      <span className="sr-only absolute">
        {`${time.hours}:${time.minutes}:${time.seconds}`}
      </span>

      {/* Days */}
      {shouldShowDays && (
        <>
          {daysStr.split("").map((digit, i) => (
            <FlipUnit
              key={`d-${i}`}
              digit={digit}
              size={resolvedSize}
              variant={resolvedVariant}
            />
          ))}
          <ClockSeparator size={resolvedSize} />
        </>
      )}

      {/* Hours */}
      {hoursStr.split("").map((digit, index) => (
        <FlipUnit
          key={`hour-${index}`}
          digit={digit}
          size={resolvedSize}
          variant={resolvedVariant}
        />
      ))}

      <ClockSeparator size={resolvedSize} />

      {/* Minutes */}
      {minutesStr.split("").map((digit, index) => (
        <FlipUnit
          key={`minute-${index}`}
          digit={digit}
          size={resolvedSize}
          variant={resolvedVariant}
        />
      ))}

      <ClockSeparator size={resolvedSize} />

      {/* Seconds */}
      {secondsStr.split("").map((digit, index) => (
        <FlipUnit
          key={`second-${index}`}
          digit={digit}
          size={resolvedSize}
          variant={resolvedVariant}
        />
      ))}

      {/* Injected Keyframes (The Shadcn "Cheat Code") */}
      <style jsx global>{`
        /* Use the same duration for both to keep them in sync */
        .animate-flip-top {
          animation: flip-top-anim 0.6s ease-in forwards;
        }
        .animate-flip-bottom {
          animation: flip-bottom-anim 0.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-flip-top,
          .animate-flip-bottom {
            animation: none;
          }
        }

        @keyframes flip-top-anim {
          0% {
            transform: rotateX(0deg);
            z-index: 30;
          }
          50%,
          100% {
            transform: rotateX(-90deg);
            z-index: 10;
          }
        }

        @keyframes flip-bottom-anim {
          0%,
          50% {
            transform: rotateX(90deg);
            z-index: 10;
          }
          100% {
            transform: rotateX(0deg);
            z-index: 30;
          }
        }
      `}</style>
    </div>
  );
}

function getTime(countdown: boolean, targetDate?: Date): TimeLeft {
  const now = new Date();

  // Real-time Clock Mode
  if (!countdown) {
    return {
      days: 0,
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    };
  }

  // Countdown Mode
  if (!targetDate) return {days: 0, hours: 0, minutes: 0, seconds: 0};
  const diff = Math.max(0, targetDate.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
