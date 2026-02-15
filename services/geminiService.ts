import { GoogleGenAI, Type, Schema } from "@google/genai";
import { KnowledgeGraphData, ScenarioResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface FileInput {
  mimeType: string;
  data: string; // Base64 encoded string
}

/**
 * Extracts structured Knowledge Graph data (Nodes and Links) from raw text or document files.
 */
export const extractKnowledgeFromText = async (
  input: string | FileInput, 
  currentGraph: KnowledgeGraphData
): Promise<KnowledgeGraphData> => {
  const modelId = "gemini-3-flash-preview";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique name of the entity" },
            group: { type: Type.STRING, description: "Category of the entity (e.g., Person, Technology, Location)" }
          },
          required: ["id", "group"]
        }
      },
      links: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING, description: "ID of the source node" },
            target: { type: Type.STRING, description: "ID of the target node" },
            relationship: { type: Type.STRING, description: "Description of the relationship" }
          },
          required: ["source", "target", "relationship"]
        }
      }
    },
    required: ["nodes", "links"]
  };

  const existingNodesStr = currentGraph.nodes.map(n => n.id).join(", ");
  
  // Construct the prompt parts
  const parts = [];

  // System instructions as part of the content flow for context
  const promptInstruction = `
    Analyze the provided content (text or document) and extract a knowledge graph structure consisting of Nodes (entities) and Links (relationships).
    
    Current Knowledge Base Nodes: [${existingNodesStr}]
    
    Instructions:
    1. Identify new key entities and categorize them.
    2. Identify relationships between new entities and existing entities if possible.
    3. Return JSON matching the schema.
  `;

  parts.push({ text: promptInstruction });

  if (typeof input === 'string') {
    parts.push({ text: `Text to analyze:\n"${input}"` });
  } else {
    // Multimodal input (PDF, Doc, etc.)
    parts.push({ 
      inlineData: {
        mimeType: input.mimeType,
        data: input.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a specialized Knowledge Graph Engineer. Your goal is to extract structured data from any input format."
      }
    });

    const jsonText = response.text || "{\"nodes\": [], \"links\": []}";
    const data = JSON.parse(jsonText) as KnowledgeGraphData;
    
    // Add default visual value
    const processedNodes = data.nodes.map(n => ({ ...n, val: 5 }));
    
    return { nodes: processedNodes, links: data.links };
  } catch (error) {
    console.error("Extraction failed:", error);
    throw new Error("Failed to extract knowledge from input.");
  }
};

/**
 * Solves a scenario/event using the internal Knowledge Graph AND Google Search.
 */
export const solveScenarioWithIntegration = async (
  scenario: string, 
  knowledgeGraph: KnowledgeGraphData
): Promise<ScenarioResult> => {
  // Using Gemini 3 Pro for advanced reasoning and tool use
  const modelId = "gemini-3-pro-preview"; 

  // Flatten graph for context
  const graphContext = JSON.stringify(knowledgeGraph);

  const prompt = `
    Input Event/Scenario: "${scenario}"

    Your Goal: Generate a highly practical, actionable solution for this event.

    Resources:
    1. Internal Knowledge Base (provided below): Use this as the foundation.
    2. Google Search (Tool): Use this to validate, polish, and find the latest external information.

    Process:
    1. ANALYZE the event against the Internal Knowledge Base. Identify relevant entities and previous data points.
    2. SEARCH the web for real-time context, best practices, or similar recent events to ensure the solution is up-to-date.
    3. SYNTHESIZE a solution. 
       - It must explicitly reference internal knowledge where applicable.
       - It must be refined by external insights (search results).
       - It must be formatted as a "Practical Action Plan".

    Internal Knowledge Base (JSON):
    ${graphContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a Senior Solutions Architect. You excel at combining proprietary internal data with global real-time intelligence to produce concrete, actionable business solutions."
      }
    });

    // Extract Grounding Metadata (Search Sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri
      }));

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as Array<{ title: string; uri: string }>;

    return {
      solution: response.text || "Could not generate a solution.",
      sources: uniqueSources
    };
  } catch (error) {
    console.error("Solution generation failed:", error);
    throw new Error("Failed to generate solution.");
  }
};