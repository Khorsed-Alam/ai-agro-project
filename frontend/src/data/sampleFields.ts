import type { Field, AIModuleInfo } from '../types';

export const IS_DEMO_DATA = true;
export const DEMO_DATA_LABEL = "Demo Data (University Lab Prototype)";

export const SAMPLE_FIELDS: Field[] = [
  {
    id: 'field_a',
    name: 'Field A',
    crop: 'Rice',
    soilMoisture: 75,
    soilPH: 6.5,
    temperature: 28,
    humidity: 70,
    rainfall: 15,
    status: 'Healthy',
    waterRequirement: 'Low'
  },
  {
    id: 'field_b',
    name: 'Field B',
    crop: 'Tomato',
    soilMoisture: 45,
    soilPH: 6.2,
    temperature: 31,
    humidity: 60,
    rainfall: 8,
    status: 'Moderate',
    waterRequirement: 'Moderate'
  },
  {
    id: 'field_c',
    name: 'Field C',
    crop: 'Maize',
    soilMoisture: 20,
    soilPH: 5.9,
    temperature: 34,
    humidity: 50,
    rainfall: 2,
    status: 'Dry',
    waterRequirement: 'High'
  },
  {
    id: 'field_d',
    name: 'Field D',
    crop: 'Potato',
    soilMoisture: 10,
    soilPH: 5.7,
    temperature: 35,
    humidity: 45,
    rainfall: 1,
    status: 'Critical',
    waterRequirement: 'Urgent'
  }
];

export const AI_MODULES: AIModuleInfo[] = [
  {
    id: 'kmeans',
    name: 'K-Means Clustering',
    category: 'Machine Learning',
    status: 'Coming in Week 2',
    week: 2,
    description: 'Soil moisture & crop grouping based on environmental metrics.',
    route: '/ai-analysis'
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree Classifier',
    category: 'Machine Learning',
    status: 'Coming in Week 2',
    week: 2,
    description: 'Irrigation & crop recommendation rules engine.',
    route: '/ai-analysis'
  },
  {
    id: 'cnn',
    name: 'CNN Leaf Disease Detection',
    category: 'Deep Learning',
    status: 'Research Ready',
    week: 1,
    description: 'Transfer learning architecture design for plant disease classification.',
    route: '/disease-detection'
  },
  {
    id: 'csp',
    name: 'Constraint Satisfaction (CSP)',
    category: 'Constraint Satisfaction',
    status: 'Foundation Ready',
    week: 1,
    description: 'Irrigation resource allocation with field & pump constraints.',
    route: '/irrigation'
  },
  {
    id: 'ac3',
    name: 'AC-3 Algorithm',
    category: 'Constraint Satisfaction',
    status: 'Foundation Ready',
    week: 1,
    description: 'Arc consistency algorithm for domain reduction in irrigation schedules.',
    route: '/algorithms'
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    category: 'Search Algorithm',
    status: 'Foundation Ready',
    week: 1,
    description: 'Uninformed graph search for level-by-level decision path discovery.',
    route: '/algorithms'
  },
  {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    category: 'Search Algorithm',
    status: 'Foundation Ready',
    week: 1,
    description: 'Uninformed search for deep diagnostic exploration of farm conditions.',
    route: '/algorithms'
  },
  {
    id: 'astar',
    name: 'A* Pathfinding Algorithm',
    category: 'Search Algorithm',
    status: 'Foundation Ready',
    week: 1,
    description: 'Heuristic search using f(n) = g(n) + h(n) for farm tractor pathfinding.',
    route: '/algorithms'
  },
  {
    id: 'minimax',
    name: 'Minimax Algorithm',
    category: 'Optimization',
    status: 'Coming in Week 2',
    week: 2,
    description: 'Adversarial decision making for extreme weather vs crop protection strategy.',
    route: '/ai-analysis'
  },
  {
    id: 'genetic',
    name: 'Genetic Algorithm',
    category: 'Optimization',
    status: 'Coming in Week 2',
    week: 2,
    description: 'Multi-objective crop yield and water usage optimization.',
    route: '/ai-analysis'
  }
];
