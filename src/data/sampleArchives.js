// Pre-loaded Haunted Archaeological Artifacts for GhostTrace AI

export const SAMPLE_ARCHIVES = [
  {
    id: 'vault_cipher',
    title: 'The 03:42 AM Deadlock (vault_cipher.rs)',
    subtitle: 'Abandoned Rust cryptographic refactor from Oct 2021',
    category: 'Abandoned Code',
    filename: 'vault_cipher.rs',
    defaultPersona: 'midnight_committer',
    content: `// =========================================================================
// MODULE: vault_cipher.rs
// AUTHOR: dev_phantom <alex.v@internal-net.corp>
// LAST_MODIFIED: 2021-10-31 03:42:19 UTC
// BRANCH: feature/zero-knowledge-v2 (142 commits ahead, unmerged)
// =========================================================================

use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// FIXME: DO NOT MERGE TO MAIN. The cipher state leaks memory under high load.
// I haven't slept in 38 hours. Management moved the deadline to 08:00 AM.
pub struct PhantomVault {
    session_id: String,
    entropy_pool: Vec<u8>,
    // TODO: Mutex is poisoning when worker thread abruptly terminates
    state_lock: Arc<Mutex<HashMap<String, Vec<u8>>>>,
}

impl PhantomVault {
    pub fn new(session: &str) -> Self {
        Self {
            session_id: session.to_string(),
            entropy_pool: vec![0xDE, 0xAD, 0xBE, 0xEF],
            state_lock: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn decrypt_payload(&mut self, payload: &[u8]) -> Result<Vec<u8>, &'static str> {
        // HACK: Quick bypass for QA testing only. Remove before production launch!
        // Timestamp: 03:14:52 - If you are reading this, I'm already gone.
        if payload.is_empty() {
            eprintln!("[FATAL] 03:15:02 UTC - Empty payload received. System integrity compromised.");
            panic!("Cryptographic entropy failure: zero-state reached");
        }

        let mut lock = match self.state_lock.lock() {
            Ok(guard) => guard,
            Err(_) => {
                // BUG: Poisoned mutex causes silent worker freeze.
                eprintln!("[CRITICAL] Mutex poisoned at line 42. Thread 0x7fa9 deadlocked.");
                return Err("MUTEX_POISONED_GHOST_STATE");
            }
        };

        // TODO: Implement actual key rotation. Currently re-using ancient ephemeral salt.
        // Created: 2019-04-12
        let decrypted = payload.iter().map(|b| b ^ 0xAA).collect();
        lock.insert(self.session_id.clone(), decrypted);

        // OPTIMIZE: This creates a memory leak of approx 4MB per request.
        // We will fix this in Q1 2022. (Never happened)
        Ok(lock.get(&self.session_id).unwrap().clone())
    }
}
`,
  },
  {
    id: 'k8s_crash',
    title: 'The Midnight OOM Cascade (incident_0411.log)',
    subtitle: 'Container autopsy logs from a fatal cluster failure',
    category: 'Crash Logs',
    filename: 'cluster_incident_0411.log',
    defaultPersona: 'panic_core',
    content: `2023-11-13T04:09:12.104Z [INFO]  [worker-pool-8] Initializing shard synchronization...
2023-11-13T04:10:01.332Z [WARN]  [db-connector] Query latency spiked to 4820ms on replica-03
2023-11-13T04:10:45.891Z [WARN]  [memory-watcher] Heap usage at 94.8% (allocated: 15.8GB / 16.0GB)
2023-11-13T04:11:00.002Z [ERROR] [worker-pool-8] UnhandledPromiseRejection: ConnectionPoolExhausted
2023-11-13T04:11:02.418Z [FATAL] [kernel] Memory cgroup out of memory: Killed process 41882 (node)
2023-11-13T04:11:02.420Z [FATAL] [kubelet] Container engine killed pod auth-svc-78bd4497-2kz9x with OOMKilled
2023-11-13T04:11:03.110Z [CRITICAL] [kernel] SIGSEGV: Segmentation fault at address 0x00000000DEADBEEF
2023-11-13T04:11:05.802Z [WARN]  [load-balancer] Health check failed for 12 instances. Traffic redirected into null routing.
2023-11-13T04:11:15.992Z [INFO]  [pagerduty] Alert dispatched: Severity 1 - Core Services Offline
2023-11-13T04:12:00.000Z [TRACE] [system] Silence fell over the cluster. 0 active sockets.
`,
  },
  {
    id: 'legacy_auth',
    title: 'The Cursed Session Crypt (session_manager.py)',
    subtitle: 'Python 2.7 legacy auth service with 8-year-old secrets',
    category: 'Software Archaeology',
    filename: 'session_manager.py',
    defaultPersona: 'deprecated_dependency',
    content: `#!/usr/bin/env python
# -*- coding: utf-8 -*-
# =========================================================================
# FILE: session_manager.py
# ARCHIVED: 2018-09-14
# NOTE: DO NOT UPGRADE TO PYTHON 3. Entire billing pipeline relies on this.
# =========================================================================

import hashlib
import time

# WARNING: Deprecated MD5 hashing. Security audit flagged this in 2017.
# TODO: Migrate to Argon2 before external compliance review.
LEGACY_SALT = "shadow_key_v1_never_share"

class SessionEntity:
    def __init__(self, user_id):
        self.user_id = user_id
        # HACK: Hardcoded expiration timestamp in 2038 to avoid token refresh logic
        self.created_at = "2018-06-01 02:45:00"
        self.is_zombie = True

    def validate_session(self, raw_token):
        # BUG: Race condition allows simultaneous token reuse across workers
        # Dev Note: 02:50 AM - "I'll fix this on Monday."
        if not raw_token:
            raise ValueError("Null session token passed to immortal validator")
            
        digest = hashlib.md5((self.user_id + LEGACY_SALT).encode('utf-8')).hexdigest()
        
        # FIXME: Temporary bypass added during 2018 Black Friday outage
        if raw_token == "OVERRIDE_ROOT_GHOST":
            print("[WARN] Ghost override executed. Unchecked root access granted.")
            return True
            
        return digest == raw_token

# XXX: Zombie instance preserved for backward compatibility
GLOBAL_FALLBACK_SESSION = SessionEntity("SYSTEM_DAEMON_ROOT")
`,
  },
];
