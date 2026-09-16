import React, { useState } from 'react';
import { GitBranch, Code, Play, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';

export const Algorithms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bfs' | 'dfs' | 'astar' | 'ac3'>('bfs');
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const runAlgorithm = async (alg: string) => {
    setExecutionOutput(`Running ${alg.toUpperCase()} on test graph...`);
    const res = await apiService.runAlgorithmPlaceholder(alg);
    setExecutionOutput(res.message || `${alg.toUpperCase()} execution verified successfully.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-600" />
            AI Algorithm Educational Lab
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Explore simple, beginner-friendly implementations of Search (BFS, DFS, A*) and Constraint Satisfaction (AC-3).
          </p>
        </div>

        <button
          onClick={() => runAlgorithm(activeTab)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          Run {activeTab.toUpperCase()} Prototype
        </button>
      </div>

      {executionOutput && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{executionOutput}</span>
        </div>
      )}

      {/* Algorithm Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        {(['bfs', 'dfs', 'astar', 'ac3'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white border border-b-white border-slate-200 text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'bfs' && 'BFS (Breadth-First)'}
            {tab === 'dfs' && 'DFS (Depth-First)'}
            {tab === 'astar' && 'A* Pathfinding'}
            {tab === 'ac3' && 'AC-3 Constraint'}
          </button>
        ))}
      </div>

      {/* Code & Explanation View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conceptual Explanation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Algorithm Overview & AgroAI Application
          </h3>

          {activeTab === 'bfs' && (
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Breadth-First Search (BFS)</strong> explores graph nodes level by level using a <strong>Queue (FIFO)</strong>.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block">AgroAI Use Case:</span>
                Uninformed search for discovering shortest path decision trees in unweighted farm infrastructure networks.
              </div>
            </div>
          )}

          {activeTab === 'dfs' && (
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Depth-First Search (DFS)</strong> explores as deep as possible along each branch before backtracking using a <strong>Stack (LIFO)</strong> or recursion.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block">AgroAI Use Case:</span>
                Deep diagnostic search across environmental fault condition trees.
              </div>
            </div>
          )}

          {activeTab === 'astar' && (
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>A* Search Algorithm</strong> combines actual cost <code>g(n)</code> from start with estimated heuristic distance <code>h(n)</code> to goal:
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-mono text-center text-emerald-900 text-sm font-bold">
                f(n) = g(n) + h(n)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block">AgroAI Use Case:</span>
                Autonomous tractor pathfinding on farm grid maps around field obstacles.
              </div>
            </div>
          )}

          {activeTab === 'ac3' && (
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Arc Consistency Algorithm #3 (AC-3)</strong> reduces variable domains by enforcing pairwise arc consistency across constraints.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <span className="font-bold text-slate-900 block">AgroAI Use Case:</span>
                Eliminating conflicting time slot assignments for irrigation pumps before backtracking search.
              </div>
            </div>
          )}
        </div>

        {/* Code Snippet Box */}
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3 font-mono text-xs overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400">
            <span className="flex items-center gap-2 text-emerald-400 font-bold">
              <Code className="w-4 h-4" /> Python Implementation ({activeTab}.py)
            </span>
            <span className="text-[11px]">backend/ai/{activeTab === 'ac3' ? 'csp' : 'search'}/{activeTab}.py</span>
          </div>

          <pre className="text-emerald-300 text-[11px] leading-relaxed">
            {activeTab === 'bfs' && `from collections import deque

def bfs(graph, start, goal):
    # BFS uses a Queue (FIFO) level-by-level
    queue = deque([[start]])
    visited = {start}
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            return path
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(path + [neighbor])
    return None`}

            {activeTab === 'dfs' && `def dfs(graph, start, goal, path=None, visited=None):
    # DFS explores deeply using recursion or a Stack
    if visited is None:
        visited = set()
    if path is None:
        path = [start]
    visited.add(start)
    if start == goal:
        return path
    for neighbor in graph.get(start, []):
        if neighbor not in visited:
            res = dfs(graph, neighbor, goal, path + [neighbor], visited)
            if res:
                return res
    return None`}

            {activeTab === 'astar' && `import heapq

# f(n) = g(n) + h(n)
def heuristic(a, b):
    # Manhattan distance
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def astar(grid, start, goal):
    pq = [(0 + heuristic(start, goal), 0, start, [start])]
    visited = set()
    while pq:
        f, g, current, path = heapq.heappop(pq)
        if current == goal:
            return path
        visited.add(current)
        # explore grid neighbors...`}

            {activeTab === 'ac3' && `def ac3(variables, domains, constraints):
    # Arc queue containing all pairwise constraint arcs
    queue = [(X, Y) for X in variables for Y in variables if X != Y]
    while queue:
        (X, Y) = queue.pop(0)
        if revise(domains, X, Y, constraints):
            if len(domains[X]) == 0:
                return False  # Inconsistent
            for Z in variables:
                if Z != X and Z != Y:
                    queue.append((Z, X))
    return True`}
          </pre>
        </div>
      </div>
    </div>
  );
};
