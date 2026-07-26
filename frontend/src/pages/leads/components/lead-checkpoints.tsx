import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CHECKPOINT_LABELS, CHECKPOINT_ORDER, CHECKPOINT_POINTS } from "@/lib/crm"
import { updateLeadCheckpoint } from "@/services/leads"
import type { CheckpointKey, LeadCheckpoint } from "@/types/lead"
import { cn } from "@/lib/utils"

export function LeadCheckpoints({
  leadId,
  checkpoints,
}: {
  leadId: string
  checkpoints: LeadCheckpoint[]
}) {
  const queryClient = useQueryClient()

  const toggleMutation = useMutation({
    mutationFn: ({ key, checked }: { key: CheckpointKey; checked: boolean }) =>
      updateLeadCheckpoint(leadId, key, checked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", leadId] })
      queryClient.invalidateQueries({ queryKey: ["leads", leadId, "timeline"] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: () => toast.error("Falha ao atualizar checkpoint"),
  })

  function isChecked(key: CheckpointKey) {
    return checkpoints.find((c) => c.key === key)?.checked ?? false
  }

  return (
    <ul className="space-y-2">
      {CHECKPOINT_ORDER.map((key) => {
        const checked = isChecked(key)
        return (
          <li key={key}>
            <label
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm transition-colors",
                checked && "border-ember/40 bg-accent/50"
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 accent-ember"
                  checked={checked}
                  disabled={toggleMutation.isPending}
                  onChange={(e) =>
                    toggleMutation.mutate({ key, checked: e.target.checked })
                  }
                />
                {CHECKPOINT_LABELS[key]}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                +{CHECKPOINT_POINTS[key]}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
