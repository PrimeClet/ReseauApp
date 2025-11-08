<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin',
                'surname' => 'Super',
                'username' => 'admin',
                'phone' => '1234567890',
                'role' => 'administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'), // Mot de passe sécurisé
                'is_active' => true,
            ],
            [
                'name' => 'John',
                'surname' => 'Doe',
                'username' => 'johndoe',
                'phone' => '0987654321',
                'role' => 'user',
                'email' => 'johndoe@example.com',
                'password' => Hash::make('password'),
                'is_active' => true,
            ],
            [
                'name' => 'Jane',
                'surname' => 'Smith',
                'username' => 'janesmith',
                'phone' => '1122334455',
                'role' => 'technicien',
                'email' => 'janesmith@example.com',
                'password' => Hash::make('password'),
                'is_active' => true,
            ],
            [
                'name' => 'Alice',
                'surname' => 'Brown',
                'username' => 'alicebrown',
                'phone' => '6677889900',
                'role' => 'directeur',
                'email' => 'alicebrown@example.com',
                'password' => Hash::make('password'),
                'is_active' => true,
            ],
        ];

        // Insérer les utilisateurs dans la base de données
        foreach ($users as $user) {
            User::create($user);
        }
    }
}
