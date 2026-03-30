"use client"

import { createContext, useContext, type ReactNode } from "react"
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

type ToastVariant = "info" | "success" | "error"

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneMap: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  info: {
    icon: Info,
    className: "border-cyan-300/30 bg-slate-950/95 text-cyan-50",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-300/30 bg-slate-950/95 text-emerald-50",
  },
  error: {
    icon: CircleAlert,
    className: "border-rose-300/30 bg-slate-950/95 text-rose-50",
  },
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  function pushToast({ title, description, variant = "info" }: ToastInput) {
    const tone = toneMap[variant]
    const Icon = tone.icon

    toast.custom(
      (toastState) => (
        <div
          role="status"
          className={`pointer-events-auto w-full max-w-md rounded-[22px] border px-4 py-3 shadow-2xl shadow-black/35 backdrop-blur transition-all duration-200 ${
            toastState.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          } ${tone.className}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full border border-white/10 bg-white/10 p-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{title}</p>
              {description ? <p className="mt-1 text-sm leading-6 opacity-90">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(toastState.id)}
              className="interactive-button min-h-[44px] min-w-[44px] rounded-full border border-white/10 bg-white/10 p-2 text-white/80 transition-all duration-200 hover:bg-white/15"
              aria-label="Fechar aviso"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ),
      {
        duration: variant === "error" ? 6500 : 4500,
      },
    )
  }

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ top: 16, left: 16, right: 16 }}
        toastOptions={{
          className: "!bg-transparent !shadow-none !p-0",
          ariaProps: {
            role: "status",
            "aria-live": "polite",
          },
        }}
      />
    </ToastContext.Provider>
  )
}

export function useAppToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider")
  }

  return context
}
