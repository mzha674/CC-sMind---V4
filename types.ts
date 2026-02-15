export interface GraphNode {
  id: string;
  group: string; // e.g., "Concept", "Person", "Technology"
  val?: number; // Visualization size
}

export interface GraphLink {
  source: string; // Node ID
  target: string; // Node ID
  relationship: string; // Label for the edge
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ScenarioResult {
  solution: string;
  sources: Array<{ title: string; uri: string }>;
  thoughtProcess?: string;
}

export enum AppMode {
  GRAPH_VIEW = 'GRAPH_VIEW',
  IMPORT_DATA = 'IMPORT_DATA',
  SOLVE_SCENARIO = 'SOLVE_SCENARIO'
}