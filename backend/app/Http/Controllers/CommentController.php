<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Signal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    public function index(
        Request $request,
        Signal $signal,
    ): AnonymousResourceCollection {
        return CommentResource::collection(
            $signal->comments()->with("user:id,name")->latest()->paginate(15),
        );
    }

    public function store(
        StoreCommentRequest $request,
        Signal $signal,
    ): CommentResource {
        $comment = $signal
            ->comments()
            ->create([
                ...$request->validated(),
                "user_id" => $request->user()->getKey(),
            ]);

        return CommentResource::make($comment->load("user:id,name"));
    }
}
