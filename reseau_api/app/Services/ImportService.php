<?php

namespace App\Services;

use App\Models\Coffret;
use App\Models\Equipement;
use App\Models\Liaison;
use App\Models\Port;
use App\Models\System;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ImportService
{
    /**
     * CSV templates for each entity type.
     */
    private const TEMPLATES = [
        'coffrets' => "code,nom,piece,long,lat,status\nCOF001,Coffret Principal,Salle Serveur,2.5,48.8,active",
        'equipements' => "equipement_code,name,type,description,direction_in_out,vlan,ip_address,coffret_id,status\nEQ001,Switch Principal,switch,Switch 24 ports,in,100,192.168.1.1,1,active",
        'ports' => "port_label,device_name,poe_enabled,vlan,speed,connected_equipment_id\nPort1,Switch01,1,100,1000,1",
        'liaisons' => "from,to,label,media,length,status\n1,2,Liaison principale,fibre,50,active",
        'systems' => "name,type,description,ip_address,status\nServeur Web,server,Serveur HTTP principal,192.168.1.10,active",
    ];

    /**
     * Import data from CSV file, routed by entity type.
     *
     * @return array{imported: int, errors: array, total: int}
     */
    public function import(UploadedFile $file, string $type): array
    {
        $data = $this->parseCsv($file);

        if (empty($data)) {
            throw new \InvalidArgumentException('Le fichier CSV est vide ou mal formaté');
        }

        $result = match ($type) {
            'coffrets' => $this->importCoffrets($data),
            'equipements' => $this->importEquipements($data),
            'ports' => $this->importPorts($data),
            'liaisons' => $this->importLiaisons($data),
            'systems' => $this->importSystems($data),
        };

        return [
            'imported' => $result['imported'],
            'errors' => $result['errors'],
            'total' => count($data),
        ];
    }

    /**
     * Get the CSV template content for a given entity type.
     */
    public function getTemplate(string $type): ?string
    {
        return self::TEMPLATES[$type] ?? null;
    }

    /**
     * Parse a CSV file into an associative array of rows.
     */
    private function parseCsv(UploadedFile $file): array
    {
        $data = [];
        $handle = fopen($file->getPathname(), 'r');

        $headers = fgetcsv($handle, 0, ',');

        if (! $headers) {
            fclose($handle);

            return [];
        }

        // Clean headers (trim whitespace, remove BOM)
        $headers = array_map(function ($header) {
            return trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header));
        }, $headers);

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($row) === count($headers)) {
                $data[] = array_combine($headers, array_map('trim', $row));
            }
        }

        fclose($handle);

        return $data;
    }

    /**
     * Import coffrets from parsed CSV data.
     *
     * @return array{imported: int, errors: array}
     */
    private function importCoffrets(array $data): array
    {
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                $validator = Validator::make($row, [
                    'nom' => 'required|string|max:255',
                    'piece' => 'required|string',
                    'long' => 'nullable|numeric',
                    'lat' => 'nullable|numeric',
                    'status' => 'nullable|in:active,inactive,maintenance',
                ]);

                if ($validator->fails()) {
                    $errors[] = 'Ligne '.($index + 2).': '.implode(', ', $validator->errors()->all());

                    continue;
                }

                Coffret::updateOrCreate(
                    ['code' => $row['code'] ?? null],
                    [
                        'nom' => $row['nom'],
                        'piece' => $row['piece'],
                        'long' => $row['long'] ?? null,
                        'lat' => $row['lat'] ?? null,
                        'status' => $row['status'] ?? 'active',
                    ]
                );
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return ['imported' => $imported, 'errors' => $errors];
    }

    /**
     * Import equipements from parsed CSV data.
     *
     * @return array{imported: int, errors: array}
     */
    private function importEquipements(array $data): array
    {
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                $validator = Validator::make($row, [
                    'name' => 'required|string|max:255',
                    'type' => 'required|string',
                    'coffret_id' => 'nullable|exists:coffrets,id',
                ]);

                if ($validator->fails()) {
                    $errors[] = 'Ligne '.($index + 2).': '.implode(', ', $validator->errors()->all());

                    continue;
                }

                Equipement::updateOrCreate(
                    ['equipement_code' => $row['equipement_code'] ?? null],
                    [
                        'name' => $row['name'],
                        'type' => $row['type'],
                        'description' => $row['description'] ?? null,
                        'direction_in_out' => $row['direction_in_out'] ?? null,
                        'vlan' => $row['vlan'] ?? null,
                        'ip_address' => $row['ip_address'] ?? null,
                        'coffret_id' => $row['coffret_id'] ?? null,
                        'status' => $row['status'] ?? 'active',
                    ]
                );
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return ['imported' => $imported, 'errors' => $errors];
    }

    /**
     * Import ports from parsed CSV data.
     *
     * @return array{imported: int, errors: array}
     */
    private function importPorts(array $data): array
    {
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                $validator = Validator::make($row, [
                    'port_label' => 'required|string|max:255',
                    'device_name' => 'required|string',
                ]);

                if ($validator->fails()) {
                    $errors[] = 'Ligne '.($index + 2).': '.implode(', ', $validator->errors()->all());

                    continue;
                }

                Port::create([
                    'port_label' => $row['port_label'],
                    'device_name' => $row['device_name'],
                    'poe_enabled' => filter_var($row['poe_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'vlan' => $row['vlan'] ?? null,
                    'speed' => $row['speed'] ?? null,
                    'connected_equipment_id' => $row['connected_equipment_id'] ?? null,
                ]);
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return ['imported' => $imported, 'errors' => $errors];
    }

    /**
     * Import liaisons from parsed CSV data.
     *
     * @return array{imported: int, errors: array}
     */
    private function importLiaisons(array $data): array
    {
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                $validator = Validator::make($row, [
                    'from' => 'required|exists:equipements,id',
                    'to' => 'required|exists:equipements,id',
                    'label' => 'required|string|max:255',
                ]);

                if ($validator->fails()) {
                    $errors[] = 'Ligne '.($index + 2).': '.implode(', ', $validator->errors()->all());

                    continue;
                }

                Liaison::create([
                    'from' => $row['from'],
                    'to' => $row['to'],
                    'label' => $row['label'],
                    'media' => $row['media'] ?? null,
                    'length' => $row['length'] ?? null,
                    'status' => $row['status'] ?? 'active',
                ]);
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return ['imported' => $imported, 'errors' => $errors];
    }

    /**
     * Import systems from parsed CSV data.
     *
     * @return array{imported: int, errors: array}
     */
    private function importSystems(array $data): array
    {
        $imported = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($data as $index => $row) {
                $validator = Validator::make($row, [
                    'name' => 'required|string|max:255',
                    'type' => 'required|string',
                ]);

                if ($validator->fails()) {
                    $errors[] = 'Ligne '.($index + 2).': '.implode(', ', $validator->errors()->all());

                    continue;
                }

                System::create([
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'description' => $row['description'] ?? null,
                    'ip_address' => $row['ip_address'] ?? null,
                    'status' => $row['status'] ?? 'active',
                ]);
                $imported++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return ['imported' => $imported, 'errors' => $errors];
    }
}
