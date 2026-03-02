<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogService
{
    /**
     * Get a paginated, filtered list of activity logs.
     */
    public function list(Request $request): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = ActivityLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = $request->get('per_page', 50);

        return $query->paginate($perPage);
    }

    /**
     * Find a single activity log with its user.
     */
    public function find(int $id): ActivityLog
    {
        return ActivityLog::with('user')->findOrFail($id);
    }

    /**
     * Get aggregated statistics for a date range.
     */
    public function stats(Request $request): array
    {
        $dateFrom = $request->get('date_from', now()->subDays(30));
        $dateTo = $request->get('date_to', now());

        return [
            'total_actions' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'actions_by_type' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->selectRaw('action, count(*) as count')
                ->groupBy('action')
                ->get(),
            'actions_by_user' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->with('user:id,name')
                ->selectRaw('user_id, count(*) as count')
                ->groupBy('user_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),
            'actions_by_model' => ActivityLog::whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereNotNull('model_type')
                ->selectRaw('model_type, count(*) as count')
                ->groupBy('model_type')
                ->get(),
            'recent_activities' => ActivityLog::with('user:id,name')
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * Get logs for a specific model type and ID.
     */
    public function modelLogs(string $modelType, int $modelId): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::with('user:id,name,email')
            ->where('model_type', $modelType)
            ->where('model_id', $modelId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Delete logs older than a given number of days and log the cleanup action.
     */
    public function cleanup(int $days): int
    {
        $deletedCount = ActivityLog::where('created_at', '<', now()->subDays($days))->delete();

        ActivityLog::log(
            'cleanup',
            "Nettoyage des logs de plus de {$days} jours. {$deletedCount} logs supprimés."
        );

        return $deletedCount;
    }
}
