#!/bin/bash
set -e

# Use the correct DISPLAY for Docker setup
export DISPLAY=:1

# Configuration
HYPERTHREADS_PER_CLIENT=2  # Each DreamBot client gets 2 hyperthreads for better performance
CLIENTS_PER_WORKSPACE=4
MONITOR_INTERVAL=5
CPU_STATS_INTERVAL=10
DREAMBOT_PROCESS_PATTERN="java.*dreambot"
ETERNALFARM_AGENT_PATTERN="EternalFarmAgent"

echo "Running as user: $(whoami)"
echo "DISPLAY is set to: $DISPLAY"

# Test if X server is accessible
if xset q &>/dev/null; then
    echo "X server is accessible"
else
    echo "ERROR: X server not accessible"
    exit 1
fi

# Test if wmctrl works
if wmctrl -d &>/dev/null; then
    echo "Desktop environment is ready"
else
    echo "Waiting for desktop environment..."
    for i in {1..30}; do
        if wmctrl -d &>/dev/null; then
            echo "Desktop environment ready after $i attempts"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            echo "ERROR: Desktop environment not ready after 60 seconds"
            exit 1
        fi
    done
fi

expand_cpu_list() {
    local input="$1"
    local result=()
    IFS=',' read -ra parts <<< "$input"
    for part in "${parts[@]}"; do
        if [[ "$part" =~ ^([0-9]+)-([0-9]+)$ ]]; then
            for ((i=${BASH_REMATCH[1]}; i<=${BASH_REMATCH[2]}; i++)); do
                result+=("$i")
            done
        else
            result+=("$part")
        fi
    done
    echo "${result[@]}"
}

get_allowed_cpus() {
    local allowed_list
    allowed_list=$(grep Cpus_allowed_list /proc/1/status | awk '{print $2}')
    local all_cpus=($(expand_cpu_list "$allowed_list"))
    local min_cpu=${all_cpus[0]}
    for cpu in "${all_cpus[@]}"; do
        (( cpu < min_cpu )) && min_cpu=$cpu
    done
    local available_cpus=()
    for cpu in "${all_cpus[@]}"; do
        if [[ "$cpu" != "$min_cpu" ]]; then
            available_cpus+=("$cpu")
        fi
    done
    echo "${available_cpus[@]}"
}

get_hyperthread_assignments() {
    local cpus=($@)
    local assignments=()
    local num_cpus=${#cpus[@]}
    
    # Each DreamBot client gets HYPERTHREADS_PER_CLIENT hyperthreads
    for ((i=0; i<num_cpus; i+=HYPERTHREADS_PER_CLIENT)); do
        if ((i + HYPERTHREADS_PER_CLIENT <= num_cpus)); then
            local thread_set=""
            for ((j=0; j<HYPERTHREADS_PER_CLIENT; j++)); do
                thread_set+="${cpus[i+j]},"
            done
            thread_set=${thread_set%,}  # Remove trailing comma
            assignments+=("$thread_set")
        fi
    done
    
    echo "${assignments[@]}"
}

show_cpu_topology() {
    echo "=== CPU Topology Information ==="
    
    # Show physical vs logical CPU mapping
    if [ -f /proc/cpuinfo ]; then
        echo "Physical CPU cores and their hyperthreads:"
        awk '/^processor|^physical id|^core id/ {
            if ($1 == "processor") proc = $3
            if ($1 == "physical" && $2 == "id") phys = $4  
            if ($1 == "core" && $2 == "id") {
                core = $4
                print "Logical CPU " proc ": Physical CPU " phys ", Core " core
            }
        }' /proc/cpuinfo | sort -n -k3
    fi
    
    # Show hyperthreading status
    local logical_cpus=$(nproc)
    local physical_cores=$(lscpu | grep "Core(s) per socket" | awk '{print $4}')
    local sockets=$(lscpu | grep "Socket(s)" | awk '{print $2}')
    local total_physical_cores=$((physical_cores * sockets))
    
    echo ""
    echo "Total logical CPUs (hyperthreads): $logical_cpus"
    echo "Total physical cores: $total_physical_cores"
    echo "Hyperthreads per DreamBot client: $HYPERTHREADS_PER_CLIENT"
    
    if [ $logical_cpus -gt $total_physical_cores ]; then
        echo "Hyperthreading: ENABLED (2 threads per core)"
    else
        echo "Hyperthreading: DISABLED"
    fi
    echo "=========================="
}

monitor_cpu_usage() {
    local log_file="/var/log/dreambot_cpu_stats.log"
    
    while true; do
        {
            echo "=== DreamBot Performance Monitor ==="
            echo "Date: $(date)"
            echo ""
            
            # Get DreamBot PIDs
            local dreambot_pids=($(pgrep -f "$DREAMBOT_PROCESS_PATTERN" 2>/dev/null || echo ""))
            local agent_pids=($(pgrep -f "$ETERNALFARM_AGENT_PATTERN" 2>/dev/null || echo ""))
            
            echo "Found ${#dreambot_pids[@]} DreamBot clients and ${#agent_pids[@]} EternalFarm agents"
            
            # Monitor DreamBot clients
            if [ ${#dreambot_pids[@]} -gt 0 ]; then
                echo "=== DreamBot Clients ==="
                for pid in "${dreambot_pids[@]}"; do
                    if [ -n "$pid" ]; then
                        local affinity=$(taskset -pc "$pid" 2>/dev/null | grep -o 'list: [0-9,-]*' | cut -d' ' -f2 || echo "unknown")
                        local cpu_usage=$(ps -p "$pid" -o %cpu --no-headers 2>/dev/null | tr -d ' ' || echo "0")
                        local mem_usage=$(ps -p "$pid" -o %mem --no-headers 2>/dev/null | tr -d ' ' || echo "0")
                        local thread_count=$(ps -o nlwp= -p "$pid" 2>/dev/null | tr -d ' ' || echo "0")
                        
                        echo "PID: $pid"
                        echo "  CPU Threads: $affinity"
                        echo "  CPU Usage: ${cpu_usage}%"
                        echo "  Memory: ${mem_usage}%"
                        echo "  Threads: $thread_count"
                        echo ""
                    fi
                done
            fi
            
            # Monitor EternalFarm agents
            if [ ${#agent_pids[@]} -gt 0 ]; then
                echo "=== EternalFarm Agents ==="
                for pid in "${agent_pids[@]}"; do
                    if [ -n "$pid" ]; then
                        local affinity=$(taskset -pc "$pid" 2>/dev/null | grep -o 'list: [0-9,-]*' | cut -d' ' -f2 || echo "unknown")
                        local cpu_usage=$(ps -p "$pid" -o %cpu --no-headers 2>/dev/null | tr -d ' ' || echo "0")
                        local mem_usage=$(ps -p "$pid" -o %mem --no-headers 2>/dev/null | tr -d ' ' || echo "0")
                        
                        echo "PID: $pid"
                        echo "  CPU Thread: $affinity"
                        echo "  CPU Usage: ${cpu_usage}%"
                        echo "  Memory: ${mem_usage}%"
                        echo ""
                    fi
                done
            fi
            
            echo "=== Per-Hyperthread CPU Usage ==="
            mpstat -P ALL 1 1 2>/dev/null | grep -E "Average.*[0-9]" || echo "mpstat not available"
            echo ""
        } | tee -a "$log_file"
        
        sleep "$CPU_STATS_INTERVAL"
    done
}

pin_dreambot_client() {
    local pid="$1"
    local hyperthread_set="$2"
    
    if [ -n "$pid" ] && [ -n "$hyperthread_set" ]; then
        echo "Pinning DreamBot client PID $pid to hyperthreads: $hyperthread_set"
        
        # Set CPU affinity
        if taskset -pc "$hyperthread_set" "$pid" &>/dev/null; then
            echo "  ✓ CPU affinity set successfully"
            
            # Set process priority
            if renice -10 "$pid" &>/dev/null; then
                echo "  ✓ Process priority set"
            else
                echo "  ✗ Failed to set process priority"
            fi
            
            # Verify the pinning
            local current_affinity=$(taskset -pc "$pid" 2>/dev/null | grep -o 'list: [0-9,-]*' | cut -d' ' -f2 || echo "unknown")
            echo "  ✓ Verified CPU affinity: $current_affinity"
            return 0
        else
            echo "  ✗ Failed to set CPU affinity"
            return 1
        fi
    fi
    return 1
}

arrange_windows() {
    local cpus=($(get_allowed_cpus))
    local hyperthread_assignments=($(get_hyperthread_assignments "${cpus[@]}"))
    local num_assignments=${#hyperthread_assignments[@]}
    
    echo "Available hyperthreads: ${cpus[*]}"
    echo "Hyperthread assignments: ${hyperthread_assignments[*]}"
    echo "Maximum DreamBot clients supported: $num_assignments"
    
    # Look for DreamBot windows
    local dreambot_pids=($(pgrep -f "$DREAMBOT_PROCESS_PATTERN" 2>/dev/null || echo ""))
    
    if [ ${#dreambot_pids[@]} -eq 0 ]; then
        echo "No DreamBot clients found to manage"
        return
    fi

    echo "Found ${#dreambot_pids[@]} DreamBot clients to manage"

    # Pin each DreamBot client to its assigned hyperthreads
    for ((i=0; i<${#dreambot_pids[@]} && i<num_assignments; i++)); do
        local pid="${dreambot_pids[$i]}"
        if [ -n "$pid" ]; then
            pin_dreambot_client "$pid" "${hyperthread_assignments[$i]}"
        fi
    done
}

main() {
    echo "Starting hyperthread-optimized DreamBot CPU manager..."
    echo "Configuration:"
    echo "  - Hyperthreads per DreamBot client: $HYPERTHREADS_PER_CLIENT"
    echo "  - Clients per workspace: $CLIENTS_PER_WORKSPACE"
    echo "  - Monitor interval: $MONITOR_INTERVAL seconds"
    echo "  - CPU stats interval: $CPU_STATS_INTERVAL seconds"
    echo ""
    
    show_cpu_topology
    echo ""

    # Start CPU monitoring in background
    monitor_cpu_usage &
    local monitor_pid=$!
    echo "CPU monitor started with PID: $monitor_pid"

    # Main CPU management loop
    while true; do
        arrange_windows
        sleep "$MONITOR_INTERVAL"
    done
}

cleanup() {
    echo "Cleaning up..."
    jobs -p | xargs -r kill 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

main