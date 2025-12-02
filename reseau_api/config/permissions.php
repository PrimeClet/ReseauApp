<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Rôles et permissions applicatives
    |--------------------------------------------------------------------------
    |
    | Ce fichier définit, pour chaque rôle fonctionnel, la liste des
    | permissions auxquelles il a accès. Le middleware "permission"
    | utilise ce mapping pour autoriser ou refuser une requête.
    |
    | Les permissions sont purement applicatives (pas stockées en base)
    | et peuvent être adaptées à vos besoins.
    |
    */

    'roles' => [
        'administrator' => [
            'view_inventory',
            'manage_inventory',
            'view_stats',
            'manage_cartography',
            'view_cartography',
            'manage_users',
        ],

        'directeur' => [
            'view_inventory',
            'view_stats',
            'view_cartography',
        ],

        'technicien' => [
            'view_inventory',
            'view_cartography',
        ],
    ],
];


