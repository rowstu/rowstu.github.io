#!/usr/bin/env bash
#
# firestick-debloat.sh - Amazon Fire Stick 4K ADB Debloat Script
#
# Removes Amazon telemetry, tracking, advertising, and bloatware
# over ADB on port 5555. No root required. All changes are recoverable.
#
# Usage:
#   ./firestick-debloat.sh [OPTIONS]
#
# Options:
#   --ip <IP>       Fire Stick IP address (required unless already connected)
#   --dry-run       Show what would be done without making changes
#   --backup        Create a package backup before debloating
#   --restore       Restore all previously removed packages
#   --status        Show current debloat status
#   --alexa         Also remove Alexa voice stack
#   --ota           Also disable OTA updates (prevents re-bloating)
#   --launcher      Disable Amazon launcher (must have alternative installed!)
#   --all           Run full debloat + alexa + ota
#   --help          Show this help message
#

set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Config ──────────────────────────────────────────────────────────────────

DRY_RUN=false
DO_BACKUP=false
DO_RESTORE=false
DO_STATUS=false
DO_ALEXA=false
DO_OTA=false
DO_LAUNCHER=false
FIRESTICK_IP=""
ADB_PORT=5555
BACKUP_DIR="./firestick-backup-$(date +%Y%m%d)"
LOG_FILE="./firestick-debloat-$(date +%Y%m%d-%H%M%S).log"

# ─── Package Lists ───────────────────────────────────────────────────────────

# Advertising & shopping
ADVERTISING_REMOVE=(
    com.amazon.advertisingidsettings
    com.amazon.videoads.app
    com.amazon.shoptv.client
    com.amazon.alexashopping
    com.amazon.avod
)

# Telemetry, metrics & data collection
TELEMETRY_REMOVE=(
    com.amazon.client.metrics
    com.amazon.client.metrics.api
    com.amazon.tv.fw.metrics
    com.amazon.dp.logger
    com.amazon.device.crashmanager
    com.amazon.device.logmanager
    com.amazon.precog
    com.amazon.connectivitydiag
    com.amazon.webview.metrics.service
)

# Amazon media apps
MEDIA_REMOVE=(
    com.amazon.bueller.music
    com.amazon.bueller.photos
    com.amazon.kindle.cms
    com.amazon.kindle.devicecontrols
    com.amazon.ods.kindleconnect
    com.amazon.bueller.notification
)

# Amazon services bloat
SERVICES_REMOVE=(
    com.amazon.tahoe
    com.amazon.recess
    com.amazon.ags.app
    com.amazon.tmm.tutorial
    com.amazon.tv.legal.notices
    com.amazon.tv.support
    com.amazon.tv.releasenotes
    com.amazon.hedwig
    com.amazon.tv.csapp
    com.amazon.android.marketplace
    com.amazon.venezia
)

# Sync, messaging & communication
SYNC_REMOVE=(
    com.amazon.device.sync
    com.amazon.device.sync.sdk.internal
    com.amazon.sync.provider.ipc
    com.amazon.sync.service
    com.amazon.device.messaging
    com.amazon.device.messaging.sdk.internal.library
    com.amazon.device.messaging.sdk.library
    com.amazon.tcomm
    com.amazon.tcomm.client
    com.amazon.communication.discovery
)

# Connectivity & casting
CONNECTIVITY_REMOVE=(
    com.amazon.bluetoothdfu
    com.amazon.device.bluetoothdfu
    com.amazon.awvflingreceiver
    com.amazon.dialservice
    com.amazon.ssdpservice
    com.amazon.wifilocker
    com.amazon.cast.sink
    com.amazon.whisperjoin.middleware.np
)

# Misc FireOS bloat
MISC_REMOVE=(
    com.amazon.aca
    com.amazon.ale
    com.amazon.aria
    com.amazon.ceviche
    com.amazon.dpcclient
    com.amazon.firebat
    com.amazon.firerestapiframework
    com.amazon.ftv.xpicker
    com.amazon.ftv.glorialist
    com.amazon.gloria.graphiq
    com.amazon.katoch
    com.amazon.naatyam
    com.amazon.logan
    com.amazon.kso.blackbird
    com.amazon.appaccesskeyprovider
    com.amazon.tifobserver
    com.amazon.dcp
    com.amazon.dcp.contracts.framework.library
    com.amazon.alta.h2clientservice
    com.amazon.device.sale.service
    com.amznfuse.operatorredirection
)

# Alexa voice stack (--alexa flag)
ALEXA_REMOVE=(
    com.amazon.vizzini
    com.amazon.avl.ftv
    com.amazon.alexa.externalmediaplayer.fireos
    com.amazon.tv.alexanotifications
    com.amazon.tv.alexaalerts
    com.amazon.cardinal
)

# OTA updates (--ota flag, disable only)
OTA_DISABLE=(
    com.amazon.device.software.ota
    com.amazon.device.software.ota.override
    com.amazon.settings.systemupdates
    com.amazon.tv.forcedotaupdater.v2
)

# Security / auth (disable only)
SECURITY_DISABLE=(
    com.amazon.securitysyncclient
    com.amazon.sharingservice.android.client.proxy
    com.amazon.parentalcontrols
    com.amazon.tv.parentalcontrols
)

# Launcher (--launcher flag, disable only)
LAUNCHER_DISABLE=(
    com.amazon.tv.launcher
    com.amazon.firehomestarter
)

# ─── Functions ───────────────────────────────────────────────────────────────

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

check_adb() {
    if ! command -v adb &>/dev/null; then
        log "${RED}Error: adb not found in PATH${NC}"
        exit 1
    fi
}

connect_firestick() {
    if [[ -n "$FIRESTICK_IP" ]]; then
        log "Connecting to Fire Stick at ${FIRESTICK_IP}:${ADB_PORT}..."
        local result
        result=$(adb connect "${FIRESTICK_IP}:${ADB_PORT}" 2>&1)
        if echo "$result" | grep -qi "connected\|already"; then
            log "${GREEN}Connected${NC}"
        else
            log "${RED}Failed to connect: $result${NC}"
            log "Make sure ADB debugging is enabled on the Fire Stick:"
            log "  Settings > My Fire TV > Developer Options > ADB Debugging"
            exit 1
        fi
        # Give it a moment to stabilise
        sleep 1
    fi

    local device_count
    device_count=$(adb devices | grep -c "device$" || true)

    if [[ "$device_count" -eq 0 ]]; then
        log "${RED}Error: No ADB device connected${NC}"
        log "  Use --ip <FIRESTICK_IP> or connect manually:"
        log "  adb connect <FIRESTICK_IP>:5555"
        exit 1
    fi

    local device_model
    device_model=$(adb shell getprop ro.product.model 2>/dev/null || echo "unknown")
    local fireos_ver
    fireos_ver=$(adb shell getprop ro.build.version.name 2>/dev/null || echo "unknown")
    local android_ver
    android_ver=$(adb shell getprop ro.build.version.release 2>/dev/null || echo "unknown")

    log "${GREEN}Connected:${NC} $device_model (FireOS $fireos_ver / Android $android_ver)"
}

is_installed() {
    adb shell pm list packages --user 0 2>/dev/null | grep -q "^package:$1$"
}

package_exists() {
    adb shell pm list packages 2>/dev/null | grep -q "^package:$1$"
}

uninstall_package() {
    local pkg="$1"

    if ! is_installed "$pkg"; then
        log "  ${YELLOW}SKIP${NC}  $pkg (not installed)"
        return
    fi

    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   adb shell pm uninstall -k --user 0 $pkg"
        return
    fi

    local result
    result=$(adb shell pm uninstall -k --user 0 "$pkg" 2>&1)

    if echo "$result" | grep -qi "success"; then
        log "  ${GREEN}OK${NC}    $pkg"
    else
        log "  ${RED}FAIL${NC}  $pkg ($result)"
    fi
}

disable_package() {
    local pkg="$1"

    if ! package_exists "$pkg"; then
        log "  ${YELLOW}SKIP${NC}  $pkg (not present)"
        return
    fi

    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   adb shell pm disable-user --user 0 $pkg"
        return
    fi

    local result
    result=$(adb shell pm disable-user --user 0 "$pkg" 2>&1)

    if echo "$result" | grep -qi "disabled\|new state"; then
        log "  ${GREEN}OK${NC}    $pkg (disabled)"
    else
        log "  ${RED}FAIL${NC}  $pkg ($result)"
    fi
}

restore_package() {
    local pkg="$1"

    # Try to re-enable first
    adb shell pm enable "$pkg" 2>/dev/null || true

    # Then try to reinstall for user
    local result
    result=$(adb shell cmd package install-existing "$pkg" 2>&1)

    if echo "$result" | grep -qi "installed\|success\|already"; then
        log "  ${GREEN}OK${NC}    $pkg (restored)"
    else
        log "  ${YELLOW}SKIP${NC}  $pkg ($result)"
    fi
}

do_backup() {
    log "\n${BOLD}Creating backup...${NC}"
    mkdir -p "$BACKUP_DIR"

    adb shell pm list packages > "$BACKUP_DIR/packages_all.txt"
    adb shell pm list packages --user 0 > "$BACKUP_DIR/packages_user0.txt"
    adb shell pm list packages -d > "$BACKUP_DIR/packages_disabled.txt"

    {
        echo "Device: $(adb shell getprop ro.product.model)"
        echo "FireOS: $(adb shell getprop ro.build.version.name)"
        echo "Android: $(adb shell getprop ro.build.version.release)"
        echo "Build: $(adb shell getprop ro.build.display.id)"
        echo "Date: $(date)"
    } > "$BACKUP_DIR/device_info.txt"

    log "${GREEN}Backup saved to $BACKUP_DIR/${NC}"
}

do_restore() {
    log "\n${BOLD}Restoring all debloated packages...${NC}\n"

    local all_packages=()
    all_packages+=("${ADVERTISING_REMOVE[@]}")
    all_packages+=("${TELEMETRY_REMOVE[@]}")
    all_packages+=("${MEDIA_REMOVE[@]}")
    all_packages+=("${SERVICES_REMOVE[@]}")
    all_packages+=("${SYNC_REMOVE[@]}")
    all_packages+=("${CONNECTIVITY_REMOVE[@]}")
    all_packages+=("${MISC_REMOVE[@]}")
    all_packages+=("${ALEXA_REMOVE[@]}")
    all_packages+=("${OTA_DISABLE[@]}")
    all_packages+=("${SECURITY_DISABLE[@]}")
    all_packages+=("${LAUNCHER_DISABLE[@]}")

    for pkg in "${all_packages[@]}"; do
        restore_package "$pkg"
    done

    log "\n${GREEN}Restore complete. Rebooting...${NC}"
    adb reboot
}

do_status() {
    log "\n${BOLD}Debloat Status Report${NC}\n"

    local removed=0
    local disabled=0
    local present=0

    check_group() {
        local label="$1"
        shift
        local pkgs=("$@")

        log "${CYAN}$label:${NC}"
        for pkg in "${pkgs[@]}"; do
            if is_installed "$pkg"; then
                log "  ${YELLOW}INSTALLED${NC}  $pkg"
                ((present++))
            elif package_exists "$pkg"; then
                log "  ${GREEN}DISABLED${NC}   $pkg"
                ((disabled++))
            else
                log "  ${GREEN}REMOVED${NC}    $pkg"
                ((removed++))
            fi
        done
        echo
    }

    check_group "Advertising & Shopping" "${ADVERTISING_REMOVE[@]}"
    check_group "Telemetry & Metrics" "${TELEMETRY_REMOVE[@]}"
    check_group "Amazon Media Apps" "${MEDIA_REMOVE[@]}"
    check_group "Amazon Services" "${SERVICES_REMOVE[@]}"
    check_group "Sync & Messaging" "${SYNC_REMOVE[@]}"
    check_group "Connectivity & Casting" "${CONNECTIVITY_REMOVE[@]}"
    check_group "Misc FireOS Bloat" "${MISC_REMOVE[@]}"
    check_group "Alexa Voice Stack" "${ALEXA_REMOVE[@]}"
    check_group "OTA Updates" "${OTA_DISABLE[@]}"
    check_group "Security Services" "${SECURITY_DISABLE[@]}"
    check_group "Launcher" "${LAUNCHER_DISABLE[@]}"

    log "${BOLD}Summary:${NC} ${GREEN}$removed removed${NC}, ${GREEN}$disabled disabled${NC}, ${YELLOW}$present still installed${NC}"
}

do_debloat() {
    log "\n${BOLD}=== Phase 1: Advertising & Shopping ===${NC}\n"
    for pkg in "${ADVERTISING_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 2: Telemetry, Metrics & Data Collection ===${NC}\n"
    for pkg in "${TELEMETRY_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 3: Amazon Media Apps ===${NC}\n"
    for pkg in "${MEDIA_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 4: Amazon Services Bloat ===${NC}\n"
    for pkg in "${SERVICES_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 5: Sync, Messaging & Communication ===${NC}\n"
    for pkg in "${SYNC_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 6: Connectivity & Casting ===${NC}\n"
    for pkg in "${CONNECTIVITY_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 7: Misc FireOS Bloat ===${NC}\n"
    for pkg in "${MISC_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 8: Disable Security Services ===${NC}\n"
    for pkg in "${SECURITY_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

do_alexa() {
    log "\n${BOLD}=== Alexa Voice Stack Removal ===${NC}\n"
    for pkg in "${ALEXA_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done
}

do_ota() {
    log "\n${BOLD}=== Disable OTA Updates ===${NC}\n"
    log "${YELLOW}Warning: Disabling OTA means no security patches or firmware updates.${NC}\n"
    for pkg in "${OTA_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

do_launcher() {
    log "\n${BOLD}=== Disable Amazon Launcher ===${NC}\n"
    log "${YELLOW}Warning: Only do this if you have an alternative launcher installed!${NC}\n"

    if $DRY_RUN; then
        for pkg in "${LAUNCHER_DISABLE[@]}"; do
            log "  ${CYAN}DRY${NC}   adb shell pm disable-user --user 0 $pkg"
        done
        return
    fi

    read -rp "Do you have an alternative launcher installed and working? [y/N] " confirm
    if [[ "$confirm" != [yY] ]]; then
        log "${YELLOW}Skipping launcher disable. Install a launcher first.${NC}"
        return
    fi

    for pkg in "${LAUNCHER_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

show_help() {
    cat << 'HELP'
Amazon Fire Stick 4K - ADB Debloat Script

Usage: ./firestick-debloat.sh [OPTIONS]

Options:
  --ip <IP>       Fire Stick IP address (connects via port 5555)
  --dry-run       Show what would be done without making changes
  --backup        Create a package backup before debloating
  --restore       Restore all previously removed/disabled packages
  --status        Show current debloat status for all tracked packages
  --alexa         Also remove Alexa voice stack
  --ota           Also disable OTA updates (prevents re-bloating)
  --launcher      Disable Amazon launcher (alternative must be installed!)
  --all           Run full debloat + alexa + ota (not launcher)
  --help          Show this help message

Examples:
  ./firestick-debloat.sh --ip 192.168.1.50 --dry-run     # Preview changes
  ./firestick-debloat.sh --ip 192.168.1.50 --backup       # Backup + debloat
  ./firestick-debloat.sh --ip 192.168.1.50 --alexa        # Also strip Alexa
  ./firestick-debloat.sh --ip 192.168.1.50 --all          # Full clean
  ./firestick-debloat.sh --status                          # Check status
  ./firestick-debloat.sh --restore                         # Undo everything

Connection:
  Enable ADB on Fire Stick: Settings > My Fire TV > Developer Options
  Find IP: Settings > My Fire TV > About > Network
  Or connect manually: adb connect <IP>:5555

Notes:
  - All removals use "pm uninstall -k --user 0" (recoverable)
  - OTA/security packages are disabled, not removed
  - Safe to re-run after OTA updates re-enable packages
  - Logs are saved to ./firestick-debloat-*.log
HELP
}

# ─── Parse Arguments ─────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ip)
            FIRESTICK_IP="$2"
            shift 2
            ;;
        --dry-run)    DRY_RUN=true; shift ;;
        --backup)     DO_BACKUP=true; shift ;;
        --restore)    DO_RESTORE=true; shift ;;
        --status)     DO_STATUS=true; shift ;;
        --alexa)      DO_ALEXA=true; shift ;;
        --ota)        DO_OTA=true; shift ;;
        --launcher)   DO_LAUNCHER=true; shift ;;
        --all)        DO_ALEXA=true; DO_OTA=true; DO_BACKUP=true; shift ;;
        --help|-h)    show_help; exit 0 ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ─── Main ────────────────────────────────────────────────────────────────────

log "${BOLD}══════════════════════════════════════════════════════${NC}"
log "${BOLD}  Amazon Fire Stick 4K - ADB Debloat${NC}"
log "${BOLD}══════════════════════════════════════════════════════${NC}"

if $DRY_RUN; then
    log "${YELLOW}DRY RUN MODE - no changes will be made${NC}"
fi

log ""
check_adb
connect_firestick

# Handle special modes
if $DO_STATUS; then
    do_status
    exit 0
fi

if $DO_RESTORE; then
    do_restore
    exit 0
fi

# Backup first if requested
if $DO_BACKUP; then
    do_backup
fi

# Run debloat phases
do_debloat

if $DO_ALEXA; then
    do_alexa
fi

if $DO_OTA; then
    do_ota
fi

if $DO_LAUNCHER; then
    do_launcher
fi

# Summary
log "\n${BOLD}══════════════════════════════════════════════════════${NC}"
log "${GREEN}Debloat complete!${NC}"
log "${BOLD}══════════════════════════════════════════════════════${NC}"
log ""
log "Log saved to: $LOG_FILE"
log ""

if ! $DRY_RUN; then
    log "${YELLOW}Post-debloat checklist:${NC}"
    log "  1. Reboot the Fire Stick:  adb reboot"
    log "  2. Test navigation and settings"
    log "  3. Test Prime Video playback"
    log "  4. Test any sideloaded apps"
    log ""
    log "To check status later:  $0 --status"
    log "To undo everything:     $0 --restore"
fi
