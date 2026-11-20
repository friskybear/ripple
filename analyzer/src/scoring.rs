use std::collections::HashSet;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

const MAX_MATCHES: usize = 5;
const MIN_SCORE: f64 = 0.35;
const SAME_ZONE_BONUS: f64 = 0.15;
const SAME_CATEGORY_BONUS: f64 = 0.10;

const WEIGHT_IMPACT: f64 = 0.45;
const WEIGHT_CONFIRMATIONS: f64 = 0.35;
const WEIGHT_RECENCY: f64 = 0.20;
const MAX_IMPACT: f64 = 5.0;
const MAX_CONFIRMATIONS: f64 = 5.0;
const RECENCY_SCALE_DAYS: f64 = 14.0;

const STOP_WORDS: &[&str] = &[
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "i",
    "in", "is", "it", "its", "my", "not", "of", "on", "or", "so", "that", "the", "there", "this",
    "to", "was", "we", "were", "when", "with",
];

#[derive(Debug, Clone, Deserialize)]
pub struct Signal {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub zone: String,
    pub impact: u8,
    pub confirmations: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Candidate {
    pub id: i64,
    pub title: String,
    pub description: String,
    pub category: String,
    pub zone: String,
}

#[derive(Debug, PartialEq, Serialize)]
pub struct Match {
    pub signal_id: i64,
    pub score: f64,
    pub reasons: Vec<&'static str>,
}

pub fn signal_priority(signal: &Signal, now: DateTime<Utc>) -> u8 {
    let age_days = (now - signal.created_at).num_seconds() as f64 / 86_400.0;
    priority(signal.impact, signal.confirmations, age_days)
}

pub fn priority(impact: u8, confirmations: u32, age_days: f64) -> u8 {
    let impact = f64::from(impact).min(MAX_IMPACT) / MAX_IMPACT;
    let confirmations = f64::from(confirmations).min(MAX_CONFIRMATIONS) / MAX_CONFIRMATIONS;
    let recency = (-age_days.max(0.0) / RECENCY_SCALE_DAYS).exp();

    let raw =
        WEIGHT_IMPACT * impact + WEIGHT_CONFIRMATIONS * confirmations + WEIGHT_RECENCY * recency;
    (100.0 * raw).round() as u8
}

pub fn find_matches(signal: &Signal, candidates: &[Candidate]) -> Vec<Match> {
    let subject = tokens(&signal.title, &signal.description);

    let mut matches: Vec<Match> = candidates
        .iter()
        .filter(|candidate| candidate.id != signal.id)
        .filter_map(|candidate| {
            let other = tokens(&candidate.title, &candidate.description);
            let mut score = jaccard(&subject, &other);
            let mut reasons = Vec::new();

            if score > 0.0 {
                reasons.push("shared_keywords");
            }
            if candidate.zone == signal.zone {
                score += SAME_ZONE_BONUS;
                reasons.push("same_zone");
            }
            if candidate.category == signal.category {
                score += SAME_CATEGORY_BONUS;
                reasons.push("same_category");
            }

            let score = score.min(1.0);
            (score >= MIN_SCORE).then(|| Match {
                signal_id: candidate.id,
                score: (score * 100.0).round() / 100.0,
                reasons,
            })
        })
        .collect();

    matches.sort_by(|a, b| b.score.total_cmp(&a.score));
    matches.truncate(MAX_MATCHES);
    matches
}

fn tokens(title: &str, description: &str) -> HashSet<String> {
    format!("{title} {description}")
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|word| !word.is_empty() && !STOP_WORDS.contains(word))
        .map(str::to_owned)
        .collect()
}

fn jaccard(a: &HashSet<String>, b: &HashSet<String>) -> f64 {
    let union = a.union(b).count();
    if union == 0 {
        return 0.0;
    }
    a.intersection(b).count() as f64 / union as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    fn now() -> DateTime<Utc> {
        "2026-11-15T09:00:00Z".parse().unwrap()
    }

    fn signal(title: &str, description: &str, impact: u8, confirmations: u32) -> Signal {
        Signal {
            id: 1,
            title: title.into(),
            description: description.into(),
            category: "network".into(),
            zone: "lab-2".into(),
            impact,
            confirmations,
            created_at: now(),
        }
    }

    fn candidate(id: i64, title: &str, description: &str) -> Candidate {
        Candidate {
            id,
            title: title.into(),
            description: description.into(),
            category: "network".into(),
            zone: "lab-2".into(),
        }
    }

    #[test]
    fn identical_texts_score_high() {
        let s = signal(
            "Wifi drops every hour",
            "Router in the lab disconnects",
            3,
            0,
        );
        let c = candidate(7, "Wifi drops every hour", "Router in the lab disconnects");

        let matches = find_matches(&s, &[c]);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].score, 1.0);
        assert!(matches[0].reasons.contains(&"shared_keywords"));
        assert!(matches[0].reasons.contains(&"same_zone"));
        assert!(matches[0].reasons.contains(&"same_category"));
    }

    #[test]
    fn unrelated_texts_score_low() {
        let s = signal(
            "Wifi drops every hour",
            "Router in the lab disconnects",
            3,
            0,
        );
        let mut c = candidate(7, "Broken chair", "Left armrest is loose");
        c.zone = "cafe".into();
        c.category = "furniture".into();

        assert!(find_matches(&s, &[c]).is_empty());
    }

    #[test]
    fn subject_is_never_its_own_match() {
        let s = signal("Wifi drops", "Router disconnects", 3, 0);
        let mut c = candidate(1, "Wifi drops", "Router disconnects");
        c.id = s.id;

        assert!(find_matches(&s, &[c]).is_empty());
    }

    #[test]
    fn matches_are_sorted_and_capped() {
        let s = signal("Wifi drops", "Router disconnects", 3, 0);
        let candidates: Vec<Candidate> = (2..12)
            .map(|id| candidate(id, "Wifi drops", "Router disconnects"))
            .collect();

        assert_eq!(find_matches(&s, &candidates).len(), MAX_MATCHES);
    }

    #[test]
    fn priority_rises_with_impact_and_confirmations() {
        assert!(priority(5, 0, 0.0) > priority(1, 0, 0.0));
        assert!(priority(3, 4, 0.0) > priority(3, 0, 0.0));
    }

    #[test]
    fn priority_falls_with_age() {
        assert!(priority(3, 1, 0.0) > priority(3, 1, 30.0));
    }

    #[test]
    fn priority_is_bounded() {
        assert_eq!(priority(5, 5, 0.0), 100);
        assert!(priority(1, 0, 10_000.0) <= 100);
    }

    #[test]
    fn signal_priority_uses_creation_age() {
        let mut s = signal("Wifi drops", "Router disconnects", 3, 1);
        s.created_at = now() - chrono::Duration::days(14);

        assert_eq!(signal_priority(&s, now()), priority(3, 1, 14.0));
    }
}
