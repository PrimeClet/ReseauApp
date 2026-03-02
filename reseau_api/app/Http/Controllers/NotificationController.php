<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc');

        if ($request->has('read')) {
            $query->where('read', filter_var($request->read, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $perPage = $request->get('per_page', 15);
        $notifications = $query->paginate($perPage);

        return $this->paginatedResponse($notifications);
    }

    public function unreadCount(): JsonResponse
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->count();

        return $this->successResponse(['count' => $count]);
    }

    public function unread(): JsonResponse
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return $this->successResponse($notifications);
    }

    public function markAsRead($id): JsonResponse
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        $notification->markAsRead();

        return $this->successResponse($notification, 'Notification marquée comme lue');
    }

    public function markAllAsRead(): JsonResponse
    {
        Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);

        return $this->successResponse(message: 'Toutes les notifications ont été marquées comme lues');
    }

    public function destroy($id): JsonResponse
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        $notification->delete();

        return $this->successResponse(message: 'Notification supprimée');
    }

    public function show($id): JsonResponse
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        if (! $notification->read) {
            $notification->markAsRead();
        }

        return $this->successResponse($notification);
    }
}
