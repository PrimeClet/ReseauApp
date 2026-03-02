<?php

namespace App\Console\Commands;

use App\Models\Equipement;
use Illuminate\Console\Command;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class RegenerateEquipementQRCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'equipements:regenerate-qrcodes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Régénère les QR codes de tous les équipements avec la nouvelle URL';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $equipements = Equipement::all();
        $count = $equipements->count();

        if ($count === 0) {
            $this->info('Aucun équipement trouvé.');

            return 0;
        }

        $this->info("Régénération des QR codes pour {$count} équipement(s)...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        foreach ($equipements as $equipement) {
            // Générer l'URL de la page de détails
            $qrData = "{$frontendUrl}/equipements/{$equipement->equipement_code}/details";

            // Générer le QR code en format SVG
            $qrCode = QrCode::size(300)
                ->format('svg')
                ->generate($qrData);

            // Mettre à jour l'équipement
            $equipement->update(['qr_code' => $qrCode]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Terminé ! {$count} QR code(s) régénéré(s).");
        $this->info("URL de base utilisée : {$frontendUrl}");

        return 0;
    }
}
