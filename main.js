import Graph from "graphology";
import Sigma from "sigma";
// import forceAtlas2 from "graphology-layout-forceatlas2";

import FA2Layout from "graphology-layout-forceatlas2";
// import { animateNode } from "sigma/utils/animate";
// import { dragNodes } from "sigma/plugins";


let allTriples = [];  
  
function updateThreshold(value) {
  document.getElementById("threshold-value").textContent = value;
  const threshold = parseFloat(value);
  const filtered = allTriples.filter(t => t[3] >= threshold);
  drawGraph(filtered.map(([h, r, t, _]) => [h, r, t]));
}

function runExtraction() {
  const text = document.getElementById("text-input").value;
  console.log("Input text:", text);
  fetch("http://hubwork192.ischool.illinois.edu:8000/extract_doc_original", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text })
  })
    .then(res => res.json())
    .then(data => {
      // 1. 展平嵌套结构 & 提取 rel_prob
      allTriples = data.flatMap(group =>
        group.map(([h, r, t, meta]) => [h, r, t, meta.rel_prob])
      );

      // 2. 展示三元组
      const list = document.getElementById("triple-list");
      list.innerHTML = "<strong>Extracted Triples:</strong>";
      allTriples.forEach(([h, r, t, p]) => {
        const li = document.createElement("li");
        li.textContent = `${h} ---[${r}]---> ${t} (p=${p.toFixed(2)})`;
        list.appendChild(li);
      });

      // 3. 触发初始图绘制（默认阈值）
      updateThreshold(document.getElementById("threshold").value);
    })
    .catch(err => {
      console.error("Extraction error", err);
      alert("Failed to extract relations.");
    });
}

function drawGraph(triples) {
    const graph = new Graph({ multi: true });
    const allNodes = new Set();


  
    triples.forEach(([h, _, t]) => {
      allNodes.add(h);
      allNodes.add(t);
    });
  
    const nodeList = Array.from(allNodes);
    const radius = 150;

    nodeList.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodeList.length;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      graph.addNode(node, {
        label: node,
        x, y,
        size: 10,
        color: '#007acc'
      });
    });
  
    triples.forEach(([h, r, t]) => {
      graph.addEdge(h, t, {
        label: r,
        size: 1,
        color: '#888'
      });
    });

    FA2Layout.assign(graph, {
        iterations: 300, // 或者用 layout supervisor 动态刷新
        settings: FA2Layout.inferSettings(graph),
      });

    const container = document.getElementById("graph-container");
    container.innerHTML = "";
    const renderer = new Sigma(graph, container, {
        renderEdgeLabels: true 
      });

    // dragNodes(renderer, graph);
    // 🔹 添加悬停高亮功能
    const hoveredNode = { id: null };
    renderer.on('enterNode', ({ node }) => {
      hoveredNode.id = node;
      renderer.setSetting('nodeReducer', (n, attr) => {
        if (n === hoveredNode.id || graph.hasEdge(n, hoveredNode.id) || graph.hasEdge(hoveredNode.id, n)) {
          return { ...attr, color: '#e74c3c' };
        }
        return { ...attr, color: '#ccc', label: '' };
      });
      renderer.refresh();
    });
  
    renderer.on('leaveNode', () => {
      hoveredNode.id = null;
      renderer.setSetting('nodeReducer', null);
      renderer.refresh();
    });
  
    // 🔹 边悬停高亮
    renderer.setSetting('edgeLabelReducer', (edge, attr) => {
      return { ...attr, label: attr.label || "" };
    });
  }

window.onload = runExtraction;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("extract-button").addEventListener("click", runExtraction);
  });