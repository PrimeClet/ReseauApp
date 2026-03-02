<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_check_endpoint_is_accessible(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }

    public function test_api_root_returns_version_info(): void
    {
        $response = $this->getJson('/api/v1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'name',
                'Version',
            ]);
    }

    public function test_api_returns_json_for_unauthenticated(): void
    {
        $response = $this->getJson('/api/v1/coffrets');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Non authentifié.',
            ]);
    }
}
