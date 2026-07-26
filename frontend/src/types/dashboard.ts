import type { LeadStage } from "@/types/lead"

export type DashboardSummary = {
  byStage: Record<LeadStage, number>
  overdueNextAction: number
  hotStuck: number
  pipelineValue: number
}
