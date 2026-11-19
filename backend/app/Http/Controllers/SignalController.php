<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSignalRequest;
use App\Http\Resources\SignalResource;
use App\Models\Community;
use App\Models\Signal;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SignalController extends Controller
{
    public function index(
        Request $request,
        Community $community,
    ): AnonymousResourceCollection {
        $user = $request->user();

        $filters = $request->validate([
            "status" => [
                "sometimes",
                "nullable",
                "in:open,investigating,resolved",
            ],
            "category" => ["sometimes", "nullable", "string", "max:80"],
            "zone" => ["sometimes", "nullable", "string", "max:120"],
            "q" => ["sometimes", "nullable", "string", "max:120"],
            "sort" => ["sometimes", "in:priority,recent"],
        ]);

        $signals = Signal::query()
            ->where("community_id", $community->getKey())
            ->with("author:id,name")
            ->withCount("confirmations")
            ->withExists([
                "confirmations as confirmed_by_me" => fn(
                    Builder $query,
                ) => $query->where("user_id", $user->getKey()),
            ])
            ->when(
                $filters["status"] ?? null,
                fn(Builder $query, string $status) => $query->where(
                    "status",
                    $status,
                ),
            )
            ->when(
                $filters["category"] ?? null,
                fn(Builder $query, string $category) => $query->where(
                    "category",
                    $category,
                ),
            )
            ->when(
                $filters["zone"] ?? null,
                fn(Builder $query, string $zone) => $query->where(
                    "zone",
                    $zone,
                ),
            )
            ->when($filters["q"] ?? null, function (
                Builder $query,
                string $term,
            ): void {
                $query->where(function (Builder $query) use ($term): void {
                    $query
                        ->where("title", "like", "%{$term}%")
                        ->orWhere("description", "like", "%{$term}%");
                });
            });

        if (($filters["sort"] ?? "recent") === "priority") {
            $signals
                ->orderByRaw("priority IS NULL")
                ->orderByDesc("priority")
                ->latest();
        } else {
            $signals->latest();
        }

        return SignalResource::collection(
            $signals->paginate(15)->withQueryString(),
        );
    }

    public function store(
        StoreSignalRequest $request,
        Community $community,
    ): SignalResource {
        $user = $request->user();

        $signal = $community
            ->signals()
            ->create([
                ...$request->validated(),
                "author_id" => $user->getKey(),
            ]);

        $signal->load("author:id,name")->loadCount("confirmations");
        $signal->setAttribute("confirmed_by_me", false);

        return SignalResource::make($signal);
    }

    public function show(Request $request, Signal $signal): SignalResource
    {
        $user = $request->user();

        return SignalResource::make(
            $this->signalsFor($user->getKey())->findOrFail($signal->getKey()),
        );
    }

    private function signalsFor(int $userId): Builder
    {
        return Signal::query()
            ->with("author:id,name")
            ->withCount("confirmations")
            ->withExists([
                "confirmations as confirmed_by_me" => fn(
                    Builder $query,
                ) => $query->where("user_id", $userId),
            ]);
    }
}
