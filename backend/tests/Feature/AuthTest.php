<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(["sanctum.stateful" => ["localhost:5173"]]);
    }

    public function testUserCanRegister(): void
    {
        $response = $this->fromSpa()->postJson("/api/auth/register", [
            "name" => "Ada Lovelace",
            "email" => "ada@example.com",
            "password" => "correct-horse-battery",
            "password_confirmation" => "correct-horse-battery",
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath("user.name", "Ada Lovelace")
            ->assertJsonPath("user.email", "ada@example.com")
            ->assertJsonMissingPath("user.password");

        $this->assertDatabaseHas("users", ["email" => "ada@example.com"]);
        $this->assertAuthenticated("web");
        $this->assertNotSame(
            "correct-horse-battery",
            User::where("email", "ada@example.com")->value("password"),
        );
    }

    public function testRegistrationRejectsDuplicateEmail(): void
    {
        User::factory()->create(["email" => "ada@example.com"]);

        $this->fromSpa()
            ->postJson("/api/auth/register", [
                "name" => "Ada Lovelace",
                "email" => "ada@example.com",
                "password" => "correct-horse-battery",
                "password_confirmation" => "correct-horse-battery",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors("email");
    }

    public function testUserCanLogIn(): void
    {
        $user = User::factory()->create([
            "email" => "ada@example.com",
            "password" => Hash::make("correct-horse-battery"),
        ]);

        $response = $this->fromSpa()->postJson("/api/auth/login", [
            "email" => "ada@example.com",
            "password" => "correct-horse-battery",
        ]);

        $response
            ->assertOk()
            ->assertJsonPath("user.id", $user->id)
            ->assertJsonMissingPath("user.password");

        $this->assertAuthenticatedAs($user, "web");
    }

    public function testLoginRejectsIncorrectPassword(): void
    {
        User::factory()->create([
            "email" => "ada@example.com",
            "password" => Hash::make("correct-horse-battery"),
        ]);

        $this->fromSpa()
            ->postJson("/api/auth/login", [
                "email" => "ada@example.com",
                "password" => "not-the-password",
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors("email");

        $this->assertGuest("web");
    }

    public function testMeRequiresAuthentication(): void
    {
        $this->fromSpa()->getJson("/api/auth/me")->assertUnauthorized();
    }

    public function testUserCanLogOut(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, "web");

        $this->fromSpa()
            ->postJson("/api/auth/logout")
            ->assertOk()
            ->assertJson(["message" => "Logged out."]);

        $this->assertGuest("web");
    }

    private function fromSpa(): static
    {
        return $this->withHeader("Origin", "http://localhost:5173");
    }
}
