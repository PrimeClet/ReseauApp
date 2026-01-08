import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCheck, Trash2, Filter, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import notificationService, { type Notification } from "@/services/notificationService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const typeLabels: Record<string, string> = {
  nouvelle_demande: "Nouvelle demande",
  demande_validee: "Demande validée",
  demande_rejetee: "Demande rejetée",
  demande_revision: "Demande en révision",
  intervention_baie: "Intervention en cours",
};

const typeColors: Record<string, string> = {
  nouvelle_demande: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  demande_validee: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  demande_rejetee: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  demande_revision: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  intervention_baie: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const typeIcons: Record<string, string> = {
  nouvelle_demande: "🆕",
  demande_validee: "✅",
  demande_rejetee: "❌",
  demande_revision: "🔄",
  intervention_baie: "🔧",
};

const Notifications = () => {
  const { isAuthenticated, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter, typeFilter],
    queryFn: () => notificationService.getAll({
      read: filter === 'all' ? undefined : filter === 'read',
      type: typeFilter === 'all' ? undefined : typeFilter,
      per_page: 50,
    }),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast({
        title: "Notification lue",
        description: "La notification a été marquée comme lue.",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast({
        title: "Toutes les notifications lues",
        description: "Toutes les notifications ont été marquées comme lues.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast({
        title: "Notification supprimée",
        description: "La notification a été supprimée.",
      });
    },
  });

  if (isLoadingAuth) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.count ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.data?.modification_id) {
      navigate(`/modifications`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Toutes ({notificationsData?.total ?? 0})</TabsTrigger>
            <TabsTrigger value="unread">
              Non lues ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Lues ({notificationsData?.total ? notificationsData.total - unreadCount : 0})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="all">Tous les types</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <TabsContent value={filter} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <Card className="p-12 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucune notification {filter === 'unread' ? 'non lue' : filter === 'read' ? 'lue' : ''}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      !notification.read ? 'border-l-4 border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl mt-0.5">
                          {typeIcons[notification.type] || '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {notification.title}
                            </h3>
                            <Badge
                              className={`text-xs ${typeColors[notification.type] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {typeLabels[notification.type] || notification.type}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">
                                Non lu
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Notifications;

