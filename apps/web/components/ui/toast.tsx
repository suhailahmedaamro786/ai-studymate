"use client";

import * as React from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors: Record<string, string> = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-primary text-primary-foreground",
  };

  return (
    <div className={`fixed bottom-4 right-4 rounded-md px-4 py-2 shadow-lg ${colors[type]} z-50`}>
      {message}
    </div>
  );
}
