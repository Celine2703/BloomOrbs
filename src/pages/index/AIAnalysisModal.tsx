import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIAnalysisModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"confirm" | "analyzing" | "complete">("confirm");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (step === "analyzing") {
      const interval = setInterval(() => {
        setDots((prev) => {
          if (prev.length >= 3) return "";
          return prev + ".";
        });
      }, 500);

      // Auto close after 3 seconds of analysis
      const timeout = setTimeout(() => {
        setStep("complete");
        setTimeout(() => {
          onClose();
          setStep("confirm");
          setDots("");
        }, 1000);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [step, onClose]);

  const handleYes = () => {
    setStep("analyzing");
  };

  const handleNo = () => {
    onClose();
    setStep("confirm");
    setDots("");
  };

  const handleClose = () => {
    onClose();
    setStep("confirm");
    setDots("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            {step === "confirm" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-gray-700 mb-6">
                  Do you want AI to analyse your plan?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleYes} className="px-8">
                    Yes
                  </Button>
                  <Button onClick={handleNo} variant="outline" className="px-8">
                    No
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "analyzing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                  <Brain className="w-6 h-6 animate-pulse" />
                  <span className="text-lg font-medium">AI is analyzing your plan{dots}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}

            {step === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-green-600 mb-2">
                  <Brain className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-lg font-medium">Analysis complete!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}