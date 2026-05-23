import { AlertTriangle, CheckCircle } from "lucide-react";

interface NotificationMessagesProps {
  errorMsg: string;
  successMsg: string;
}

export function NotificationMessages({ errorMsg, successMsg }: NotificationMessagesProps) {
  return (
    <>
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl flex items-center gap-3 text-blue-600 dark:text-blue-400 shadow-xl">
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        </div>
      )}
    </>
  );
}