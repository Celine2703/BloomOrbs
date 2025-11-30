import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { Task, Edge } from "./types";

export default function AIAnalysisModal({
  isOpen,
  onClose,
  tasks,
  setTasks,
  edges,
  setEdges,
}: {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
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
        // Create new tasks before completing
        createNewTasks();
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
  }, [step, onClose, tasks, setTasks, edges, setEdges]);

  const createNewTasks = () => {
    // Find the most recently created task
    const lastTask = tasks.reduce((latest, task) => 
      task.createdAt > latest.createdAt ? task : latest
    );

    // Check if tasks with these names already exist
    const pilotStudyTask = tasks.find(t => t.title.toLowerCase().includes("pilot study"));
    const transcriptionTask = tasks.find(t => t.title.toLowerCase().includes("transcription"));
    const advisorReviewTask = tasks.find(t => t.title.toLowerCase().includes("advisor review"));

    const taskNames = ["Pilot Study", "Transcription", "Advisor Review"];
    const existingTasks = [pilotStudyTask, transcriptionTask, advisorReviewTask];
    
    if (existingTasks.some(task => task !== undefined)) {
      // If any tasks already exist, just create a link to the first existing one
      const firstExisting = existingTasks.find(task => task !== undefined);
      if (firstExisting) {
        // Check if link already exists
        const linkExists = edges.some(edge => 
          edge.from === lastTask.id && edge.to === firstExisting.id
        );
        
        if (!linkExists) {
          setEdges(prev => [...prev, { from: lastTask.id, to: firstExisting.id }]);
        }
      }
    } else {
      // Create all new tasks if none exist
      const baseX = lastTask.position.x + 400; // 400px spacing
      const baseY = lastTask.position.y;

      const currentTime = Date.now();
      const newTasks: Task[] = [
        {
          id: `T-${currentTime}-1`,
          axisId: "AX-03", // Analysis & Publication axis
          title: "Pilot Study",
          status: "to-do",
          priority: "medium",
          assignee: "Céline Martin",
          start: null,
          due: null,
          description: "Conduct pilot study for the research project",
          position: { x: baseX, y: baseY },
          group: "group-1",
          createdAt: currentTime + 1,
        },
        {
          id: `T-${currentTime}-2`,
          axisId: "AX-03",
          title: "Transcription",
          status: "to-do", 
          priority: "medium",
          assignee: "Céline Martin",
          start: null,
          due: null,
          description: "Transcribe collected data and interviews",
          position: { x: baseX + 400, y: baseY },
          group: "group-1",
          createdAt: currentTime + 2,
        },
        {
          id: `T-${currentTime}-3`,
          axisId: "AX-03",
          title: "Advisor Review",
          status: "to-do",
          priority: "high",
          assignee: "Céline Martin", 
          start: null,
          due: null,
          description: "Submit work for advisor review and feedback",
          position: { x: baseX + 800, y: baseY },
          group: "group-1",
          createdAt: currentTime + 3,
        }
      ];

      // Create edges connecting the tasks
      const newEdges: Edge[] = [
        { from: lastTask.id, to: newTasks[0].id }, // Last task -> Pilot Study
        { from: newTasks[0].id, to: newTasks[1].id },   // Pilot Study -> Transcription
        { from: newTasks[1].id, to: newTasks[2].id },   // Transcription -> Advisor Review
      ];

      // Add new tasks and edges
      setTasks(prev => [...prev, ...newTasks]);
      setEdges(prev => [...prev, ...newEdges]);
    }
  };

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