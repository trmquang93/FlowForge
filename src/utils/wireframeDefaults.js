export const COMPONENT_DEFAULTS = {
  rect: {
    width: 120, height: 80,
    text: "",
    style: { fill: "#f0f0f0", stroke: "#cccccc", fontSize: 13, fontWeight: "normal", borderRadius: 4, textAlign: "left" },
    interactive: false,
  },
  text: {
    width: 180, height: 24,
    text: "Label",
    style: { fill: "transparent", stroke: "none", fontSize: 14, fontWeight: "normal", borderRadius: 0, textAlign: "left" },
    interactive: false,
  },
  button: {
    width: 160, height: 44,
    text: "Button",
    style: { fill: "#333333", stroke: "none", fontSize: 14, fontWeight: "bold", borderRadius: 8, textAlign: "center" },
    interactive: true,
  },
  input: {
    width: 280, height: 44,
    text: "Placeholder...",
    style: { fill: "#ffffff", stroke: "#cccccc", fontSize: 14, fontWeight: "normal", borderRadius: 6, textAlign: "left" },
    interactive: true,
  },
  icon: {
    width: 24, height: 24,
    text: "",
    style: { fill: "#cccccc", stroke: "none", fontSize: 12, fontWeight: "normal", borderRadius: 4, textAlign: "center" },
    interactive: false,
  },
  "image-placeholder": {
    width: 200, height: 140,
    text: "Image",
    style: { fill: "#e8e8e8", stroke: "#cccccc", fontSize: 12, fontWeight: "normal", borderRadius: 4, textAlign: "center" },
    interactive: false,
  },
  "list-item": {
    width: 343, height: 52,
    text: "List Item",
    style: { fill: "#ffffff", stroke: "#eeeeee", fontSize: 14, fontWeight: "normal", borderRadius: 0, textAlign: "left" },
    interactive: true,
  },
  "nav-bar": {
    width: 393, height: 44,
    text: "Title",
    style: { fill: "#ffffff", stroke: "#eeeeee", fontSize: 17, fontWeight: "bold", borderRadius: 0, textAlign: "center" },
    interactive: false,
  },
  "tab-bar": {
    width: 393, height: 49,
    text: "Home,Search,Profile",
    style: { fill: "#ffffff", stroke: "#eeeeee", fontSize: 10, fontWeight: "normal", borderRadius: 0, textAlign: "center" },
    interactive: false,
  },
  divider: {
    width: 343, height: 1,
    text: "",
    style: { fill: "#cccccc", stroke: "none", fontSize: 0, fontWeight: "normal", borderRadius: 0, textAlign: "left" },
    interactive: false,
  },
};
