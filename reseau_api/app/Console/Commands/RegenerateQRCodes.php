<?php

namespace App\Console\Commands;

use App\Models\Coffret;
use Illuminate\Console\Command;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class RegenerateQRCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'coffrets:regenerate-qrcodes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Régénère les QR codes de tous les coffrets avec la nouvelle URL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $coffrets = Coffret::all();
        $count = $coffrets->count();

        if ($count === 0) {
            $this->info('Aucun coffret trouvé.');

            return 0;
        }

        $this->info("Régénération des QR codes pour {$count} coffret(s)...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        foreach ($coffrets as $coffret) {
            // Générer l'URL de la page de détails
            $qrData = "{$frontendUrl}/armoires/{$coffret->code}/details";

            // Générer le QR code en format SVG
            $qrCode = QrCode::size(300)
                ->format('svg')
                ->generate($qrData);

            // Mettre à jour le coffret
            $coffret->update(['qr_code' => $qrCode]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Terminé ! {$count} QR code(s) régénéré(s).");
        $this->info("URL de base utilisée : {$frontendUrl}");

        return 0;
    }
}
