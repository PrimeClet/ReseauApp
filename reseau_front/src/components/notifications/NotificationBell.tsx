import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import notificationService from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Récupérer le nombre de notifications non lues
  const { data: unreadCountData, isLoading: isLoadingCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Récupérer les notifications non lues
  const { data: unreadData, isLoading: isLoadingUnread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationService.getUnread(),
    enabled: isOpen, // Ne charger que lorsque le dropdown est ouvert
    refetchInterval: isOpen ? 10000 : false, // Rafraîchir toutes les 10 secondes si ouvert
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const unreadCount = unreadCountData?.count ?? 0;
  const notifications = unreadData?.data ?? [];

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Naviguer vers la page appropriée selon le type
    if (notification.data?.modification_id) {
      navigate(`/modifications`);
    } else {
      navigate('/notifications');
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nouvelle_demande':
        return '🆕';
      case 'demande_validee':
        return '✅';
      case 'demande_rejetee':
        return '❌';
      case 'demande_revision':
        return '🔄';
      case 'intervention_baie':
        return '🔧';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoadingCount && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Tout lire
                  </>
                )}
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          {isLoadingUnread ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    !notification.read ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DropdownMenuSeparator />
          <Button
            variant="ghost"
            className="w-full justify-center text-xs"
            onClick={() => {
              navigate('/notifications');
              setIsOpen(false);
            }}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

