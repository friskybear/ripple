mod scoring;

use std::fmt;

use actix_web::{
    App, HttpResponse, HttpServer, ResponseError, error::JsonPayloadError, http::StatusCode, web,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;

use scoring::{Candidate, Match, Signal};

const MAX_BODY_BYTES: usize = 256 * 1024;
const MAX_CANDIDATES: usize = 200;

#[derive(Deserialize)]
struct AnalyzeRequest {
    signal: Signal,
    candidates: Vec<Candidate>,
}

#[derive(Serialize)]
struct AnalyzeResponse {
    priority: u8,
    matches: Vec<Match>,
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        self.status
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status).json(json!({ "error": self.message }))
    }
}

fn json_config() -> web::JsonConfig {
    web::JsonConfig::default()
        .limit(MAX_BODY_BYTES)
        .error_handler(|err, _req| {
            let status = match err {
                JsonPayloadError::Overflow { .. }
                | JsonPayloadError::OverflowKnownLength { .. } => StatusCode::PAYLOAD_TOO_LARGE,
                _ => StatusCode::BAD_REQUEST,
            };
            ApiError {
                status,
                message: err.to_string(),
            }
            .into()
        })
}

async fn health() -> web::Json<serde_json::Value> {
    web::Json(json!({ "status": "ok" }))
}

async fn analyze(body: web::Json<AnalyzeRequest>) -> Result<web::Json<AnalyzeResponse>, ApiError> {
    let AnalyzeRequest { signal, candidates } = body.into_inner();

    if candidates.len() > MAX_CANDIDATES {
        return Err(ApiError::bad_request(format!(
            "at most {MAX_CANDIDATES} candidates are allowed"
        )));
    }
    if !(1..=5).contains(&signal.impact) {
        return Err(ApiError::bad_request(
            "signal.impact must be between 1 and 5",
        ));
    }

    let priority = scoring::signal_priority(&signal, Utc::now());
    let matches = scoring::find_matches(&signal, &candidates);

    Ok(web::Json(AnalyzeResponse { priority, matches }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let addr = std::env::var("ANALYZER_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string());

    HttpServer::new(|| {
        App::new()
            .app_data(json_config())
            .route("/health", web::get().to(health))
            .route("/v1/analyze", web::post().to(analyze))
    })
    .bind(&addr)?
    .run()
    .await
}
