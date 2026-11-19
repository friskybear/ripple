# Ripple API contract

All endpoints return JSON. Validation failures use HTTP 422 with Laravel's
`message` and `errors` fields. Private community and signal data is only
available to community members; a non-member receives 404. `GET /api/ready`
returns 200 when the database is reachable and 503 otherwise.

## Authentication

| Method | Path                 | Access                                     |
| ------ | -------------------- | ------------------------------------------ |
| POST   | `/api/auth/register` | Public, CSRF-protected stateful request    |
| POST   | `/api/auth/login`    | Public, throttled to 6 attempts per minute |
| POST   | `/api/auth/logout`   | Authenticated                              |
| GET    | `/api/me`            | Authenticated                              |

## Communities

| Method | Path                    | Access                                             |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | `/api/communities`      | Authenticated; lists only the caller's communities |
| POST   | `/api/communities`      | Authenticated; creator becomes a moderator         |
| POST   | `/api/communities/join` | Authenticated; JSON body: `invite_code`            |

Community responses include `id`, `name`, `invite_code`, and the caller's
membership `role`. Joining an existing membership is idempotent and does not
change its role.

## Signals

| Method | Path                                   | Access                           |
| ------ | -------------------------------------- | -------------------------------- |
| GET    | `/api/communities/{community}/signals` | Community member                 |
| POST   | `/api/communities/{community}/signals` | Community member                 |
| GET    | `/api/signals/{signal}`                | Member of the signal's community |
| POST   | `/api/signals/{signal}/transition`     | Community moderator              |

Signal listing accepts `status`, `category`, `zone`, `q` (title/description
search), and `sort=priority|recent`; results are paginated at 15 per page.
Create requests require `title` (max 120), `description` (max 5000),
`category`, `zone`, and `impact` (integer 1–5). Signal responses include a
minimal author (`id`, `name`), `confirmations_count`, and `confirmed_by_me`.

A transition request accepts `to` and, when resolving, a required `note`.
Allowed transitions are `open` → `investigating` → `resolved` and
`resolved` → `open`; all other transitions return 422. Resolving records
`resolved_at` and `resolution_note`; reopening clears both. Signal creation
and confirmation are limited to 30 requests per minute per user.

## Confirmations and comments

| Method | Path                             | Access           |
| ------ | -------------------------------- | ---------------- |
| POST   | `/api/signals/{signal}/confirm`  | Community member |
| DELETE | `/api/signals/{signal}/confirm`  | Community member |
| GET    | `/api/signals/{signal}/comments` | Community member |
| POST   | `/api/signals/{signal}/comments` | Community member |

Confirming more than once is idempotent. Signal authors cannot confirm their
own signals; the endpoint returns 422. Comment creation accepts a `body` up to
2000 characters. Comment authors are represented by `id` and `name` only.
