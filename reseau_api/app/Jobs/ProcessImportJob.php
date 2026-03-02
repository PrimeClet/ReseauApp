<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Services\ImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        private string $filePath,
        private string $type,
        private int $userId,
    ) {}

    public function handle(ImportService $importService): void
    {
        try {
            $file = new \Illuminate\Http\UploadedFile(
                Storage::disk('local')->path($this->filePath),
                basename($this->filePath),
                'text/csv',
                null,
                true
            );

            $result = $importService->import($file, $this->type);

            Notification::create([
                'user_id' => $this->userId,
                'type' => 'import_termine',
                'title' => 'Import terminé',
                'message' => "Import de {$this->type} terminé : {$result['imported']}/{$result['total']} éléments importés."
                    .(count($result['errors']) > 0 ? ' '.count($result['errors']).' erreur(s).' : ''),
                'data' => [
                    'type' => $this->type,
                    'imported' => $result['imported'],
                    'total' => $result['total'],
                    'errors' => array_slice($result['errors'], 0, 10),
                ],
            ]);

            Log::info("Import {$this->type} completed", $result);
        } catch (\Throwable $e) {
            Log::error("Import {$this->type} failed", ['error' => $e->getMessage()]);

            Notification::create([
                'user_id' => $this->userId,
                'type' => 'import_echoue',
                'title' => 'Import échoué',
                'message' => "L'import de {$this->type} a échoué : {$e->getMessage()}",
                'data' => ['type' => $this->type, 'error' => $e->getMessage()],
            ]);

            throw $e;
        } finally {
            Storage::disk('local')->delete($this->filePath);
        }
    }
}
