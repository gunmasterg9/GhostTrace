// GHOSTTRACE TEST FIXTURE — fake placeholder credentials only.
// Expected checks: panic detection, TODO/FIXME markers, redaction, line citations.
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// TODO: investigate lock contention under high load.
// FIXME: worker may exit while shared state is locked.
const OPENAI_KEY: &str = "sk-test-FAKE000000000000000000000000";
const GITHUB_TOKEN: &str = "ghp_FAKE000000000000000000000000000000";

fn process_job(job_id: &str) {
    let state = Arc::new(Mutex::new(HashMap::<String, String>::new()));
    // Fake database URL; do not connect to it.
    let database_url = "postgres://demo_user:FAKE_PASSWORD@localhost:5432/demo_db";

    if job_id.is_empty() {
        panic!("test fixture: empty job id");
    }
    if let Ok(mut guard) = state.lock() {
        guard.insert(job_id.to_string(), "started".to_string());
    } else {
        eprintln!("state lock poisoned");
        std::process::abort();
    }

    // Artificial bug: status is never updated to "completed".
    println!("Processing job: {job_id}");
    let _unused = database_url;
}
fn main() {
    process_job("");
}
