<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Obtenir toutes les notifications de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        $query = Notification::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc');

        // Filtrer par statut de lecture
        if ($request->has('read')) {
            $query->where('read', filter_var($request->read, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtrer par type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $perPage = $request->get('per_page', 15);
        $notifications = $query->paginate($perPage);

        return response()->json($notifications);
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    public function unreadCount()
    {
        $count = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Obtenir les notifications non lues uniquement
     */
    public function unread()
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => $notifications,
        ]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marquée comme lue',
            'data' => $notification,
        ]);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead()
    {
        Notification::where('user_id', Auth::id())
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'Toutes les notifications ont été marquées comme lues',
        ]);
    }

    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'message' => 'Notification supprimée',
        ]);
    }

    /**
     * Afficher une notification spécifique
     */
    public function show($id)
    {
        $notification = Notification::where('user_id', Auth::id())
            ->findOrFail($id);

        // Marquer comme lue si elle ne l'est pas déjà
        if (!$notification->read) {
            $notification->markAsRead();
        }

        return response()->json([
            'data' => $notification,
        ]);
    }
}
