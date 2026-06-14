import { useCallback, useEffect, useRef, useState } from "react";
import { useReactFlow, useStore } from "@xyflow/react";
import type { XYPosition } from "@xyflow/react";

/**
 * A single waypoint of an editable smart edge. Stored (active) points live in
 * `edge.data.points`; inactive points are computed on the fly for adding new
 * waypoints and are not persisted.
 */
export type ControlPointData = XYPosition & {
  id: string;
  active?: boolean;
};

export type SetControlPoints = (
  update: (points: ControlPointData[]) => ControlPointData[],
) => void;

export interface ControlPointProps {
  id: string;
  index: number;
  x: number;
  y: number;
  color: string;
  active?: boolean;
  setControlPoints: SetControlPoints;
}

const NUDGE = 5;

export function ControlPoint({
  id,
  index,
  x,
  y,
  color,
  active,
  setControlPoints,
}: Readonly<ControlPointProps>) {
  const container = useStore((store) => store.domNode);
  const { screenToFlowPosition } = useReactFlow();
  const [dragging, setDragging] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  const updatePosition = useCallback(
    (position: XYPosition) => {
      setControlPoints((points) => {
        const shouldActivate = !active;

        if (shouldActivate) {
          // Promote an inactive (insert) point to a new active waypoint with a
          // fresh id. Inactive points sit at even visual indices, active points
          // at odd indices, so the active-list insertion index is `index/2 - 1`.
          const newPoint: ControlPointData = {
            ...position,
            id: crypto.randomUUID(),
            active: true,
          };

          if (index !== 0) {
            const insertAfter = index * 0.5 - 1;
            return points.flatMap((point, i) =>
              i === insertAfter ? [point, newPoint] : [point],
            );
          }
          return [newPoint, ...points];
        }

        return points.map((point) =>
          point.id === id ? { ...point, ...position } : point,
        );
      });
    },
    [id, active, index, setControlPoints],
  );

  const deletePoint = useCallback(() => {
    setControlPoints((points) => points.filter((point) => point.id !== id));
  }, [id, setControlPoints]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
        case " ":
          if (!active) {
            event.preventDefault();
          }
          updatePosition({ x, y });
          break;
        case "Backspace":
        case "Delete":
          event.stopPropagation();
          deletePoint();
          break;
        case "ArrowLeft":
          updatePosition({ x: x - NUDGE, y });
          break;
        case "ArrowRight":
          updatePosition({ x: x + NUDGE, y });
          break;
        case "ArrowUp":
          updatePosition({ x, y: y - NUDGE });
          break;
        case "ArrowDown":
          updatePosition({ x, y: y + NUDGE });
          break;
        default:
          break;
      }
    },
    [x, y, active, updatePosition, deletePoint],
  );

  useEffect(() => {
    if (!container || !active || !dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      updatePosition(
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      setDragging(false);
      updatePosition(
        screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      );
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp, { once: true });
    container.addEventListener("pointerleave", onPointerUp, { once: true });

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerUp);
    };
  }, [container, dragging, active, screenToFlowPosition, updatePosition]);

  return (
    <circle
      ref={ref}
      tabIndex={0}
      data-testid="smart-edge-control-point"
      className={"nopan nodrag" + (active ? " active" : "")}
      cx={x}
      cy={y}
      r={active ? 4 : 3}
      strokeWidth={1}
      strokeOpacity={active ? 1 : 0.3}
      stroke={color}
      fill={active ? color : "white"}
      style={{ pointerEvents: "all", cursor: "pointer" }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (active) {
          deletePoint();
        }
      }}
      onPointerDown={(event) => {
        if (event.button === 2) return;
        updatePosition({ x, y });
        // Only active waypoints drag continuously; an inactive point is
        // promoted in place and can then be dragged on a subsequent gesture.
        if (active) {
          setDragging(true);
        }
      }}
      onKeyDown={handleKeyDown}
      onPointerUp={() => {
        setDragging(false);
      }}
    />
  );
}
