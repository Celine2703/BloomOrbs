import React from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ZoomControls({
  zoomIn,
  zoomOut,
  resetTransform,
}: {
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => zoomIn()}>
          <ZoomIn className="w-4 h-4 mr-1" />
          Zoom In
        </Button>
        <Button variant="outline" size="sm" onClick={() => zoomOut()}>
          <ZoomOut className="w-4 h-4 mr-1" />
          Zoom Out
        </Button>
        <Button variant="outline" size="sm" onClick={() => resetTransform()}>
          <Maximize2 className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>
      <div className="text-xs text-gray-500">
        Drag canvas to pan • Scroll to zoom • Double-click task to edit
      </div>
    </div>
  );
}
