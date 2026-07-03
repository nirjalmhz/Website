import { WeatherAlert } from "../types";
import { AlertTriangle, Info, ShieldAlert, X, BellOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: WeatherAlert[];
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
  activeToast: WeatherAlert | null;
  onCloseToast: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onDismissAll,
  activeToast,
  onCloseToast,
}: NotificationCenterProps) {
  // Helper for alert colors
  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case "danger":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          text: "text-red-400",
          icon: ShieldAlert,
          iconColor: "text-red-500",
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-400",
          icon: AlertTriangle,
          iconColor: "text-amber-500",
        };
      default:
        return {
          bg: "bg-sky-500/10 border-sky-500/20",
          text: "text-sky-400",
          icon: Info,
          iconColor: "text-sky-500",
        };
    }
  };

  return (
    <>
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            id="notification-toast"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
          >
            <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${getAlertStyles(activeToast.severity).bg}`}>
              <div className="mt-0.5">
                {(() => {
                  const IconComp = getAlertStyles(activeToast.severity).icon;
                  return <IconComp className={`h-5 w-5 ${getAlertStyles(activeToast.severity).iconColor} animate-bounce`} />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-bold text-white">
                    {activeToast.title}
                  </span>
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                    {activeToast.type}
                  </span>
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-slate-300">
                  {activeToast.message}
                </p>
              </div>
              <button
                id="close-toast-btn"
                onClick={onCloseToast}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Alerts Tray */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              id="notifications-tray"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <span className="font-sans text-base font-bold text-white">
                    Severe Weather Alerts
                  </span>
                </div>
                <button
                  id="close-tray-btn"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-700 text-slate-500 mb-4">
                      <BellOff className="h-6 w-6" />
                    </div>
                    <span className="font-sans text-sm font-semibold text-slate-400">
                      No Active Alerts
                    </span>
                    <p className="mt-1 max-w-xs font-sans text-xs text-slate-500 leading-relaxed">
                      All weather conditions are stable. No storm watch, heavy rain warnings, or extreme events are in effect.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const styles = getAlertStyles(alert.severity);
                    const Icon = styles.icon;
                    return (
                      <motion.div
                        key={alert.id}
                        id={`alert-card-${alert.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-xl border p-4 ${styles.bg}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${styles.iconColor}`} />
                            <span className="font-sans text-sm font-bold text-white">
                              {alert.title}
                            </span>
                          </div>
                          <button
                            id={`dismiss-alert-${alert.id}`}
                            onClick={() => onDismissAlert(alert.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                            title="Dismiss Alert"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-2 font-sans text-xs leading-relaxed text-slate-300">
                          {alert.message}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>TYPE: {alert.type.toUpperCase()}</span>
                          <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {alerts.length > 0 && (
                <div className="border-t border-white/10 p-5">
                  <button
                    id="dismiss-all-alerts-btn"
                    onClick={onDismissAll}
                    className="w-full rounded-xl border border-white/10 py-3 text-center font-sans text-xs font-bold text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    Clear All Notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
