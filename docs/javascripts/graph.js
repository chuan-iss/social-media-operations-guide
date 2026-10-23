(function () {
  const svgNS = "http://www.w3.org/2000/svg";

  function svg(tag, attrs) {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    return element;
  }

  async function renderGraph(widget) {
    const canvas = widget.querySelector(".knowledge-graph__canvas");
    try {
      const response = await fetch(widget.dataset.graphUrl);
      if (!response.ok) throw new Error("graph unavailable");
      const { nodes, edges } = await response.json();
      if (!nodes.length) return;

      const drawing = svg("svg", { viewBox: "0 0 240 160", "aria-hidden": "true" });
      const positions = new Map();
      const current = new URL(widget.dataset.currentPage, location.href).pathname;
      const centerX = 120;
      const centerY = 78;
      const radiusX = 82;
      const radiusY = 52;

      nodes.forEach((node, index) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * index) / nodes.length;
        positions.set(node.id, {
          x: centerX + radiusX * Math.cos(angle),
          y: centerY + radiusY * Math.sin(angle),
        });
      });

      edges.forEach(([source, target]) => {
        const a = positions.get(source);
        const b = positions.get(target);
        if (a && b) drawing.append(svg("line", {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke: "#c8bddb", "stroke-width": "1.5",
        }));
      });

      nodes.forEach((node) => {
        const point = positions.get(node.id);
        const active = new URL(node.url, location.href).pathname === current;
        const link = svg("a", { href: node.url, "aria-label": node.title });
        link.append(svg("circle", {
          cx: point.x, cy: point.y, r: active ? 8 : 6,
          fill: active ? "#7852b8" : "#aa91d0",
          stroke: "#fff", "stroke-width": "2",
        }));
        const title = svg("title", {});
        title.textContent = node.title;
        link.append(title);
        drawing.append(link);
      });

      canvas.replaceChildren(drawing);
    } catch {
      canvas.textContent = "关系图谱暂时不可用";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".knowledge-graph").forEach(renderGraph);
  });
})();
