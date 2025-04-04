# Checker subnet interface

1. A subnet itself is a long-running executable, which
    - performs its business logic
    - writes informative messages to `stdio`
    - exposes stats via a builtin webserver

1. A subnet needs to have its __binaries hosted__ on HTTPS accessible URLs, so that Checker can download updates. Path patterns are flexible, GitHub Releases would be nice.

    Example:
    ```
    https://github.com/filecoin-saturn/L2-node/releases
    ```

1. A subnet should run on as many operating systems as possible, without requiring any prior setup before executing its binary. On macOS, x86 is required, arm64 nice to have.

2. A subnet can provide a custom __command string__ for launching its executable. Ideally a subnet doesn't require any extra arguments when launching.

    Example:
    ```bash
    $ bacalhau # ideal
    $ bacalhau --foo=bar
    ```

3. A subnet's executable gets passed the following environment variables:
    - `FIL_WALLET_ADDRESS` The user's Filecoin wallet address
    - `STATE_ROOT` The long-lived working directory on disk. The subnet must store
      all of its permanent files inside (subdirectories of) this directory. The directory
      isn't expected to be backed up or shared across machines in any way.
    - `CACHE_ROOT` The temporary working directory on disk. The subnet must store
      all of its caches inside (subdirectories of) this directory. The directory
      isn't expected to be backed up or shared across machines in any way.

    Example:
    ```bash
    $ FIL_WALLET_ADDRESS=f1... STATE_ROOT=~/.local/state/bacalhau CACHE_ROOT=~/.cache/bacalhau bacalhau
    ```

4. A subnet communicates activity by writing to its `stdout` stream:
    - `API: $1` The subnet has launched and `$1` can be queried for fetching subnet stats (see below)
    - `INFO: $1` `$1` will be displayed to the user inside Checker's Activity Log
    - `ERROR: $1` `$1` will be displayed to the user inside Checker's Activity Log, with a warning icon
    - `$1` all log lines will be stored in a subnet-specific log file, which can be submitted to Sentry for error handling

5. A subnet is expected to have provided its `API` URL in `<=500ms`

6. A subnet's `stderr` will be stored in the same subnet-specific log file as its `stdout`, to be used for post-mortem debugging.

7. A subnet exposes its stats via HTTP(S), on an address communicated via
`stdout` (see above `API:`). The response will be a JSON object with at least
the following fields:

    ```json
    {
      "jobsCompleted": 1234
    }
    ```

    The number of jobs completed is expected to be a monotonically increasing
    number. It's the responsibility of the subnet to persist this number across
    process restarts, somewhere in `ROOT_DIR`.
    
    The subnet may include additional fields in the JSON response, although
    these will be ignored by Checker.

7. A subnet can be told to shut down via signal `SIGTERM`

8. A subnet can shut down at any time, which is always considered an error. Its exit will be shown in Checker's UI, and the last 100 lines of its output streams forwarded to Sentry. The subnet won't automatically be restarted by Checker (for now).
