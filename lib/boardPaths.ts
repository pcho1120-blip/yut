import { BoardNode, PathName } from "@/types/game";

export const START_NODE = 0;
export const TOP_RIGHT = 5;
export const TOP_LEFT = 10;
export const BOTTOM_LEFT = 15;
export const CENTER = 23;

export const boardNodes: BoardNode[] = [
  { id: 0, name: "출발", x: 85.6, y: 76.1, role: "start" },
  { id: 1, name: "도", x: 85.6, y: 63.8 },
  { id: 2, name: "개", x: 85.6, y: 51.0 },
  { id: 3, name: "걸", x: 85.6, y: 37.8 },
  { id: 4, name: "윷", x: 85.6, y: 25.2 },
  { id: 5, name: "오른쪽 위", x: 85.6, y: 10.4, role: "corner" },
  { id: 6, name: "상단 4", x: 67.9, y: 10.4 },
  { id: 7, name: "상단 3", x: 56.0, y: 10.4 },
  { id: 8, name: "상단 2", x: 44.1, y: 10.4 },
  { id: 9, name: "상단 1", x: 32.2, y: 10.4 },
  { id: 10, name: "왼쪽 위", x: 14.2, y: 10.4, role: "corner" },
  { id: 11, name: "왼쪽 1", x: 14.2, y: 25.4 },
  { id: 12, name: "왼쪽 2", x: 14.2, y: 37.8 },
  { id: 13, name: "왼쪽 3", x: 14.2, y: 51.0 },
  { id: 14, name: "왼쪽 4", x: 14.1, y: 63.8 },
  { id: 15, name: "왼쪽 아래", x: 14.2, y: 76.1, role: "corner" },
  { id: 16, name: "하단 1", x: 32.0, y: 76.1 },
  { id: 17, name: "하단 2", x: 43.9, y: 76.1 },
  { id: 18, name: "하단 3", x: 55.7, y: 76.1 },
  { id: 19, name: "하단 4", x: 67.5, y: 76.1 },
  { id: 20, name: "우상 대각 1", x: 71.0, y: 24.7, role: "diagonal" },
  { id: 21, name: "우상 대각 2", x: 60.3, y: 35.4, role: "diagonal" },
  { id: 22, name: "좌하 대각 1", x: 39.5, y: 55.4, role: "diagonal" },
  { id: 23, name: "중앙", x: 50.0, y: 45.8, role: "center" },
  { id: 24, name: "좌상 대각 1", x: 28.6, y: 24.7, role: "diagonal" },
  { id: 25, name: "좌상 대각 2", x: 39.4, y: 35.4, role: "diagonal" },
  { id: 26, name: "우하 대각 1", x: 59.9, y: 55.3, role: "diagonal" },
  { id: 27, name: "우하 대각 2", x: 70.3, y: 64.0, role: "diagonal" },
  { id: 28, name: "좌하 대각 2", x: 29.5, y: 64.0, role: "diagonal" },
];

export const paths: Record<PathName, number[]> = {
  outer: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 0],
  diagFromTopRight: [5, 20, 21, 23, 22, 28, 15, 16, 17, 18, 19, 0],
  diagFromTopLeft: [10, 24, 25, 23, 26, 27, 0],
};

export function getNode(id: number) {
  return boardNodes.find((node) => node.id === id)!;
}

export function branchChoices(nodeId: number): PathName[] {
  if (nodeId === TOP_RIGHT) return ["outer", "diagFromTopRight"];
  if (nodeId === TOP_LEFT) return ["outer", "diagFromTopLeft"];
  return ["outer"];
}

export function findPathIndex(path: PathName, nodeId: number) {
  return paths[path].indexOf(nodeId);
}

export function normalizePath(path: PathName, nodeId: number): PathName {
  if (paths[path].includes(nodeId)) return path;
  if (paths.diagFromTopRight.includes(nodeId)) return "diagFromTopRight";
  if (paths.diagFromTopLeft.includes(nodeId)) return "diagFromTopLeft";
  return "outer";
}

export function stepsToFinish(path: PathName, nodeId: number) {
  const actualPath = normalizePath(path, nodeId);
  const index = findPathIndex(actualPath, nodeId);
  if (index < 0) return 99;
  return paths[actualPath].length - 1 - index;
}

export function getDestination(path: PathName, nodeId: number, move: number) {
  if (nodeId < 0) {
    if (move <= 0) return { finished: false, nodeId: -1, path: "outer" as PathName };
    const route = paths.outer;
    const nextIndex = Math.min(move, route.length - 2);
    return { finished: false, nodeId: route[nextIndex], path: "outer" as PathName };
  }

  const actualPath = nodeId === CENTER && move > 0 ? "diagFromTopLeft" : normalizePath(path, nodeId);
  const route = paths[actualPath];
  const index = route.indexOf(nodeId);
  if (index < 0) return { finished: false, nodeId: START_NODE, path: "outer" as PathName };
  const nextIndex = Math.max(0, index + move);
  if (move < 0 && route[nextIndex] === START_NODE && index > 0) {
    return { finished: true, nodeId: START_NODE, path: actualPath };
  }
  if (move > 0 && nextIndex >= route.length - 1) {
    return { finished: true, nodeId: START_NODE, path: actualPath };
  }
  return { finished: false, nodeId: route[nextIndex] ?? START_NODE, path: actualPath };
}

export function getTravelNodes(path: PathName, nodeId: number, move: number) {
  if (move === 0) return [];
  if (nodeId < 0) {
    if (move <= 0) return [];
    return paths.outer.slice(1, Math.min(move, paths.outer.length - 2) + 1);
  }

  const actualPath = nodeId === CENTER && move > 0 ? "diagFromTopLeft" : normalizePath(path, nodeId);
  const route = paths[actualPath];
  const index = route.indexOf(nodeId);
  if (index < 0) return [];

  if (move > 0) {
    const end = Math.min(route.length - 1, index + move);
    return route.slice(index + 1, end + 1);
  }

  const end = Math.max(0, index + move);
  return route.slice(end, index).reverse();
}
