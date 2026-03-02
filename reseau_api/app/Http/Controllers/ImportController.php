<?php

namespace App\Http\Controllers;

use App\Http\Requests\Import\ImportRequest;
use App\Services\ImportService;
use Illuminate\Http\JsonResponse;

class ImportController extends Controller
{
    public function __construct(
        private readonly ImportService $importService,
    ) {}

    public function import(ImportRequest $request): JsonResponse
    {
        try {
            $result = $this->importService->import($request->file('file'), $request->type);

            return $this->successResponse($result, 'Import réussi');
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de l\'import: '.$e->getMessage(), 500);
        }
    }

    public function template(string $type)
    {
        $template = $this->importService->getTemplate($type);

        if ($template === null) {
            return $this->errorResponse('Type non reconnu', 400);
        }

        return response($template, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename={$type}_template.csv");
    }
}
