import React, { useState } from 'react';
import { apiService } from '../services/api';
import { AI_MODULES } from '../data/sampleFields';
import { useI18n } from '../i18n';

type AlgType = 'bfs' | 'dfs' | 'astar' | 'ac3' | 'kmeans' | 'dtree' | 'cnn' | 'csp';

export const Algorithms: React.FC = () => {
  const { t, translateEnum } = useI18n();
  const [activeTab, setActiveTab] = useState<AlgType>('bfs');
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const runAlgorithm = async (alg: string) => {
    const algorithm = alg.toUpperCase();
    setExecutionOutput(t('algorithms.executing', { algorithm }));
    try {
      await apiService.runAlgorithmPlaceholder(alg);
      setExecutionOutput(t('algorithms.executed', { algorithm }));
    } catch {
      setExecutionOutput(t('algorithms.completedOffline', { algorithm }));
    }
  };

  return (
    <div className="p-margin-lg space-y-space-xl max-w-[1600px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm uppercase tracking-wider mb-space-xs">
            <span>{t('algorithms.aiTheory')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{t('algorithms.algorithmicFoundations')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">{t('algorithms.educationalLab')}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            {t('algorithms.title')}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-3xl">
            {t('algorithms.description')}
          </p>
        </div>

        <button
          onClick={() => runAlgorithm(activeTab)}
          className="px-space-md py-space-sm rounded-xl bg-primary text-on-primary font-headline-sm text-body-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-space-xs self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          <span>{t('algorithms.runModel', { algorithm: activeTab.toUpperCase() })}</span>
        </button>
      </div>

      {executionOutput && (
        <div className="p-space-md rounded-xl bg-secondary-container text-on-secondary-container text-body-sm flex items-center gap-space-sm shadow-sm">
          <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <span className="font-data-mono">{executionOutput}</span>
        </div>
      )}

      {/* Algorithm Tabs */}
      <div className="flex overflow-x-auto border-b border-outline-variant/30 gap-space-xs pb-0.5">
        {[
          { id: 'bfs', icon: 'account_tree' },
          { id: 'dfs', icon: 'alt_route' },
          { id: 'astar', icon: 'route' },
          { id: 'ac3', icon: 'rule' },
          { id: 'kmeans', icon: 'bubble_chart' },
          { id: 'dtree', icon: 'schema' },
          { id: 'cnn', icon: 'filter_center_focus' },
          { id: 'csp', icon: 'functions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AlgType)}
            className={`px-space-md py-space-sm font-label-md text-label-md rounded-t-xl transition-all whitespace-nowrap flex items-center gap-space-xs cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{translateEnum('algorithms', tab.id, tab.id.toUpperCase())}</span>
          </button>
        ))}
      </div>

      {/* Code & Explanation View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Conceptual Explanation */}
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm space-y-space-md border border-outline-variant/30">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30">
            <h3 className="font-headline-sm text-headline-sm text-primary">
              {t('algorithms.overview')}
            </h3>
            <span className="font-data-mono text-label-sm bg-surface-container px-space-xs py-0.5 rounded text-secondary">
              {t('algorithms.coreModule')}
            </span>
          </div>

          {activeTab === 'bfs' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.bfsDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.bfsApplication')}
              </div>
            </div>
          )}

          {activeTab === 'dfs' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.dfsDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.dfsApplication')}
              </div>
            </div>
          )}

          {activeTab === 'astar' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.astarDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container font-data-mono text-center text-primary text-headline-sm font-semibold">
                f(n) = g(n) + h(n)
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.astarApplication')}
              </div>
            </div>
          )}

          {activeTab === 'ac3' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.ac3Description')}</p>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.ac3Application')}
              </div>
            </div>
          )}

          {activeTab === 'kmeans' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.kmeansDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container font-data-mono text-center text-primary text-headline-sm font-semibold">
                J = ∑ ∑ ||x_i - μ_j||²
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.kmeansApplication')}
              </div>
            </div>
          )}

          {activeTab === 'dtree' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.dtreeDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container font-data-mono text-center text-primary text-headline-sm font-semibold">
                Gini = 1 - ∑ (p_i)²
              </div>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.dtreeApplication')}
              </div>
            </div>
          )}

          {activeTab === 'cnn' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.cnnDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.cnnApplication')}
              </div>
            </div>
          )}

          {activeTab === 'csp' && (
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>{t('algorithms.cspDescription')}</p>
              <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30 space-y-1 text-on-surface">
                <span className="font-semibold text-primary block">{t('algorithms.application')}</span>
                {t('algorithms.cspApplication')}
              </div>
            </div>
          )}

          {/* Module Specs Card */}
          <div className="pt-space-sm border-t border-outline-variant/30">
            <h4 className="font-headline-sm text-headline-sm text-primary mb-space-xs">{t('algorithms.registeredModule')}</h4>
            <div className="grid grid-cols-2 gap-space-xs font-data-mono text-label-sm text-on-surface-variant">
              {AI_MODULES.filter((m) => m.id.includes(activeTab) || activeTab.includes(m.id)).map((mod) => {
                const moduleId = mod.id === 'decision-tree' ? 'dtree' : mod.id;
                return (
                  <div key={mod.id} className="bg-surface-container p-space-xs rounded">
                    <span className="font-semibold text-primary">{translateEnum('algorithms', moduleId, mod.name)}</span>
                    <p className="text-[11px] text-on-surface-variant">{t(`algorithms.${moduleId}Description`, mod.description)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="bg-primary p-space-lg rounded-xl shadow-md space-y-space-sm font-data-mono text-body-sm text-on-primary overflow-x-auto border border-outline-variant/20">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs text-on-primary-container">
            <span className="flex items-center gap-space-xs text-secondary font-semibold">
              <span className="material-symbols-outlined text-[18px]">code</span>
              {t('algorithms.pythonImplementation', { algorithm: activeTab })}
            </span>
            <span className="text-[11px]">backend/ai/{activeTab}.py</span>
          </div>

          <pre className="text-secondary-fixed text-[12px] leading-relaxed pt-space-xs">
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

            {activeTab === 'kmeans' && `import numpy as np

def kmeans(data, k=3, max_iters=100):
    # Initialize centroids randomly
    centroids = data[np.random.choice(len(data), k, replace=False)]
    for _ in range(max_iters):
        # Assign clusters based on Euclidean distance
        distances = np.linalg.norm(data[:, None] - centroids, axis=2)
        labels = np.argmin(distances, axis=1)
        # Update centroid means
        new_centroids = np.array([data[labels == i].mean(axis=0) for i in range(k)])
        if np.all(centroids == new_centroids):
            break
        centroids = new_centroids
    return labels, centroids`}

            {activeTab === 'dtree' && `def gini_impurity(y):
    m = len(y)
    if m == 0: return 0
    p = [np.mean(y == c) for c in np.unique(y)]
    return 1.0 - sum([pi**2 for pi in p])

def find_best_split(X, y):
    best_gini = 1.0
    best_feat, best_thresh = None, None
    for feat in range(X.shape[1]):
        thresholds = np.unique(X[:, feat])
        for t in thresholds:
            left_mask = X[:, feat] <= t
            gini = (sum(left_mask)*gini_impurity(y[left_mask]) + 
                    sum(~left_mask)*gini_impurity(y[~left_mask])) / len(y)
            if gini < best_gini:
                best_gini, best_feat, best_thresh = gini, feat, t
    return best_feat, best_thresh`}

            {activeTab === 'cnn' && `import torch
import torch.nn as nn

class PlantDiseaseCNN(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )
        self.classifier = nn.Linear(64 * 56 * 56, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        return self.classifier(x)`}

            {activeTab === 'csp' && `def backtracking_search(csp):
    return backtrack({}, csp)

def backtrack(assignment, csp):
    if len(assignment) == len(csp.variables):
        return assignment
    var = select_unassigned_variable(assignment, csp)
    for value in order_domain_values(var, assignment, csp):
        if is_consistent(var, value, assignment, csp):
            assignment[var] = value
            result = backtrack(assignment, csp)
            if result is not None:
                return result
            del assignment[var]
    return None`}
          </pre>
        </div>
      </div>
    </div>
  );
};
