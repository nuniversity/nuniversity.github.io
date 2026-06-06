export type StepType = 'concept' | 'course' | 'tool' | 'game' | 'library' | 'milestone'
export type RelationshipType = 'required' | 'optional' | 'branch'
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface RoadmapRelationship {
  leadsTo: string
  type: RelationshipType
  label?: string
}

export interface RoadmapStep {
  id: string
  title: string
  type: StepType
  contentRef?: string | null
  externalUrl?: string
  description: string
  prerequisites: string[]
  conditionals: string[]
  comments: string
  ideas: string[]
  relationships: RoadmapRelationship[]
  estimatedDuration?: string
}

export interface RoadmapMetadata {
  id: string
  title: string
  description: string
  icon: string
  order: number
  difficulty: DifficultyLevel
  estimatedDuration: string
  steps: RoadmapStep[]
}

export interface RoadmapProgress {
  roadmapId: string
  completedSteps: string[]
  startedAt: string
  lastAccessed: string
}

export const STEP_TYPE_CONFIG: Record<StepType, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-blue-500' },
  course: { label: 'Course', color: 'bg-green-500' },
  tool: { label: 'Tool', color: 'bg-purple-500' },
  game: { label: 'Game', color: 'bg-yellow-500' },
  library: { label: 'Library', color: 'bg-indigo-500' },
  milestone: { label: 'Milestone', color: 'bg-red-500' },
}

export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, { label: string; style: string }> = {
  required: { label: 'Required', style: 'border-l-4 border-blue-500' },
  optional: { label: 'Optional', style: 'border-l-4 border-gray-400' },
  branch: { label: 'Branch', style: 'border-l-4 border-purple-500' },
}
