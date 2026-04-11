import { validateInstructions } from "../../../src/utils/validateInstructions.js";
import { generateInstructionFiles } from "../../../src/utils/generateInstructionFiles.js";
import { analyzeNavGraph } from "../../../src/utils/analyzeNavGraph.js";

const PLATFORM_ENUM = ["auto", "swiftui", "react-native", "flutter", "jetpack-compose"];

export const generationTools = [
  {
    name: "validate_flow",
    description: "Run pre-generation validation checks on the current flow. Returns errors (broken targets, empty screens) and warnings.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "generate_instructions",
    description:
      "Generate the main AI build instructions from the current flow. Returns the primary instruction document (overview, screen roster, workflow). Use get_screen_instructions, get_navigation_instructions, and get_build_guide for detailed specs.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: PLATFORM_ENUM,
          description: "Target platform for framework-specific code patterns (default: 'auto')",
        },
        screenIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of screen IDs to scope generation to. When omitted, all screens are included.",
        },
      },
    },
  },
  {
    name: "get_screen_instructions",
    description:
      "Get detailed screen implementation specs: element types, hotspot positions, action mappings, acceptance criteria. Call this before implementing each screen.",
    inputSchema: {
      type: "object",
      properties: {
        screenId: {
          type: "string",
          description: "Get spec for a single screen by ID. If omitted, returns specs for all screens.",
        },
      },
    },
  },
  {
    name: "get_navigation_instructions",
    description:
      "Get the navigation architecture: connection graph, entry points, tab bar patterns, modal screens, back navigation loops. Call this before wiring any navigation.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_build_guide",
    description:
      "Get platform-specific implementation guide: folder structure, tech stack, action type mappings, transition patterns, and sub-agent workflow. Call this before writing implementation code.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: PLATFORM_ENUM,
          description: "Target platform (default: 'auto')",
        },
      },
    },
  },
  {
    name: "analyze_navigation",
    description: "Analyze the navigation graph to detect entry screens, tab bar patterns, modal screens, and back loops.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// --- Helpers ---

function buildGenerationOptions(state, args = {}) {
  const allScreens = state.screens;
  let scopedScreens = allScreens;
  let scopeScreenIds = null;

  if (args.screenIds && args.screenIds.length > 0) {
    const idSet = new Set(args.screenIds);
    scopedScreens = allScreens.filter((s) => idSet.has(s.id));
    scopeScreenIds = idSet;
    if (scopedScreens.length === 0) {
      throw new Error("No screens matched the provided screenIds.");
    }
  }

  // Run validation (matching UI behavior)
  const warnings = validateInstructions(scopedScreens, state.connections, {
    documents: state.documents,
  });

  return {
    scopedScreens,
    allScreens,
    options: {
      documents: state.documents,
      dataModels: state.dataModels,
      screenGroups: state.screenGroups,
      platform: args.platform || "auto",
      featureBrief: state.metadata.featureBrief,
      taskLink: state.metadata.taskLink,
      techStack: state.metadata.techStack,
      scopeScreenIds,
      allScreens,
      warnings,
    },
  };
}

function getFileContent(result, fileName) {
  const file = result.files.find((f) => f.name === fileName);
  return file ? file.content : null;
}

/**
 * Replace the file-reference "Instruction Files" table in main.md with MCP tool-call guidance.
 */
function adaptMainMdForMcp(mainContent, tasksContent) {
  // Replace the "Instruction Files" section with MCP tool guidance
  const fileTablePattern = /## Instruction Files\n\n>.*?\n\n\| File \| Contains \| When to read \|\n\|---.*?\|\n((\|.*?\|\n)*)\n/s;

  const mcpGuidance = `## How to Get Detailed Specs\n\n` +
    `> **Use the following MCP tools to get detailed implementation specs.**\n` +
    `> Each tool returns focused information — call them as needed during implementation.\n\n` +
    `| Tool | Contains | When to call |\n` +
    `|------|----------|--------------|\n` +
    `| \`get_screen_instructions\` | Element types, hotspot positions, action mappings, acceptance criteria | Before implementing each screen |\n` +
    `| \`get_navigation_instructions\` | Connection graph, entry points, tab bars, modals, back navigation | Before wiring any navigation |\n` +
    `| \`get_build_guide\` | Platform-specific code patterns and action type mappings | Before writing implementation code |\n` +
    `| \`get_screen\` (with screenId) | Screen image data — the definitive visual design | Before implementing each screen |\n\n`;

  let adapted = mainContent.replace(fileTablePattern, mcpGuidance);

  // Replace file-path references throughout (workflow, examples, planning sections)
  adapted = adapted.replace(/`[^`]*screens\.md`/g, "`get_screen_instructions`");
  adapted = adapted.replace(/`[^`]*navigation\.md`/g, "`get_navigation_instructions`");
  adapted = adapted.replace(/`[^`]*build-guide\.md`/g, "`get_build_guide`");
  adapted = adapted.replace(/`[^`]*images\/[^`]*`/g, "`get_screen` (with screenId)");
  adapted = adapted.replace(/from the `get_screen`[^`]*/gi, "via `get_screen` tool");
  adapted = adapted.replace(/open.*?PNG from/gi, "call `get_screen` with the screen ID to get the image from");

  // Append tasks content if present
  if (tasksContent) {
    adapted += `\n\n---\n\n${tasksContent}`;
  }

  return adapted;
}

export function handleGenerationTool(name, args, state) {
  switch (name) {
    case "validate_flow": {
      const issues = validateInstructions(state.screens, state.connections, {
        documents: state.documents,
      });
      return {
        issueCount: issues.length,
        errors: issues.filter((i) => i.level === "error"),
        warnings: issues.filter((i) => i.level === "warning"),
      };
    }

    case "generate_instructions": {
      const { scopedScreens, options } = buildGenerationOptions(state, args);
      const result = generateInstructionFiles(scopedScreens, state.connections, options);

      const mainContent = getFileContent(result, "main.md");
      const tasksContent = getFileContent(result, "tasks.md");

      const adapted = adaptMainMdForMcp(mainContent, tasksContent);

      return {
        __contentBlocks: [{ type: "text", text: adapted }],
      };
    }

    case "get_screen_instructions": {
      const { scopedScreens, options } = buildGenerationOptions(state, {});
      const result = generateInstructionFiles(scopedScreens, state.connections, options);
      const screensContent = getFileContent(result, "screens.md");

      if (args.screenId) {
        // Extract the section for a specific screen
        const screen = state.screens.find((s) => s.id === args.screenId);
        if (!screen) {
          throw new Error(`Screen not found: ${args.screenId}`);
        }
        // Find the screen's section by its name pattern in the generated markdown
        const sectionPattern = new RegExp(
          `(## Screen \\d+: ${escapeRegex(screen.name)}.*?)(?=## Screen \\d+:|---\\n\\n# Context Screens|$)`,
          "s"
        );
        const match = screensContent.match(sectionPattern);
        const section = match ? match[1].trim() : `No detailed spec found for screen "${screen.name}".`;

        return {
          __contentBlocks: [{ type: "text", text: section }],
        };
      }

      return {
        __contentBlocks: [{ type: "text", text: screensContent }],
      };
    }

    case "get_navigation_instructions": {
      const { scopedScreens, options } = buildGenerationOptions(state, {});
      const result = generateInstructionFiles(scopedScreens, state.connections, options);
      const navContent = getFileContent(result, "navigation.md");

      return {
        __contentBlocks: [{ type: "text", text: navContent }],
      };
    }

    case "get_build_guide": {
      const { scopedScreens, options } = buildGenerationOptions(state, {
        platform: args.platform,
      });
      const result = generateInstructionFiles(scopedScreens, state.connections, options);
      const buildContent = getFileContent(result, "build-guide.md");

      return {
        __contentBlocks: [{ type: "text", text: buildContent }],
      };
    }

    case "analyze_navigation": {
      return analyzeNavGraph(state.screens, state.connections);
    }

    default:
      throw new Error(`Unknown generation tool: ${name}`);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
