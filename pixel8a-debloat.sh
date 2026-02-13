#!/usr/bin/env bash
#
# pixel8a-debloat.sh - Google Pixel 8a ADB Debloat & Privacy Script
#
# Conservative, banking-app-safe debloat for stock Pixel firmware.
# Safe to re-run after OTA updates.
#
# Usage:
#   ./pixel8a-debloat.sh [OPTIONS]
#
# Options:
#   --dry-run       Show what would be done without making changes
#   --backup        Create a package backup before debloating
#   --restore       Restore all previously removed packages
#   --status        Show current debloat status
#   --optional      Also remove optional apps (Assistant, Pay, TalkBack)
#   --privacy       Apply privacy/telemetry ADB settings
#   --battery       Apply battery optimisation ADB settings
#   --all           Run full debloat + optional + privacy + battery
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
DO_OPTIONAL=false
DO_PRIVACY=false
DO_BATTERY=false
BACKUP_DIR="./pixel8a-backup-$(date +%Y%m%d)"
LOG_FILE="./pixel8a-debloat-$(date +%Y%m%d-%H%M%S).log"

# ─── Package Lists ───────────────────────────────────────────────────────────

# Google media & entertainment apps
GOOGLE_MEDIA_REMOVE=(
    com.google.android.youtube
    com.google.android.apps.youtube.music
    com.google.android.videos
    com.google.android.apps.books
    com.google.android.play.games
    com.google.android.apps.magazines
    com.google.android.apps.podcasts
)

# Google productivity & communication apps
GOOGLE_PRODUCTIVITY_REMOVE=(
    com.google.android.gm
    com.google.android.apps.maps
    com.google.android.apps.docs
    com.google.android.apps.docs.editors.docs
    com.google.android.apps.docs.editors.sheets
    com.google.android.apps.docs.editors.slides
    com.google.android.apps.tachyon
    com.google.android.apps.photos
)

# Google services & extras
GOOGLE_EXTRAS_REMOVE=(
    com.google.android.apps.subscriptions.red
    com.google.android.apps.recorder
    com.google.android.apps.tips
    com.google.android.apps.wellbeing
)

# Optional removals (--optional flag)
GOOGLE_OPTIONAL_REMOVE=(
    com.google.android.googlequicksearchbox
    com.google.android.apps.nbu.paisa.user
    com.google.android.marvin.talkback
    com.google.android.apps.cloudprint
)

# Telemetry / analytics (disable only)
GOOGLE_TELEMETRY_DISABLE=(
    com.google.android.feedback
    com.google.android.partnersetup
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

    local device_count
    device_count=$(adb devices | grep -c "device$" || true)

    if [[ "$device_count" -eq 0 ]]; then
        log "${RED}Error: No ADB device connected${NC}"
        log "  1. Enable Developer Options on your phone"
        log "  2. Enable USB Debugging"
        log "  3. Connect via USB and authorise the connection"
        exit 1
    elif [[ "$device_count" -gt 1 ]]; then
        log "${YELLOW}Warning: Multiple devices connected. Using first device.${NC}"
    fi

    local android_ver
    android_ver=$(adb shell getprop ro.build.version.release 2>/dev/null || echo "unknown")
    local device_model
    device_model=$(adb shell getprop ro.product.model 2>/dev/null || echo "unknown")

    log "${GREEN}Connected:${NC} $device_model (Android $android_ver)"
}

is_installed() {
    adb shell pm list packages --user 0 2>/dev/null | grep -q "^package:$1$"
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

    if ! adb shell pm list packages 2>/dev/null | grep -q "^package:$pkg$"; then
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
    local result

    # Try to re-enable first
    adb shell pm enable "$pkg" 2>/dev/null || true

    # Then try to reinstall for user
    result=$(adb shell cmd package install-existing "$pkg" 2>&1)

    if echo "$result" | grep -qi "installed\|success\|already"; then
        log "  ${GREEN}OK${NC}    $pkg (restored)"
    else
        log "  ${YELLOW}SKIP${NC}  $pkg (may not be restorable: $result)"
    fi
}

do_backup() {
    log "\n${BOLD}Creating backup...${NC}"
    mkdir -p "$BACKUP_DIR"

    adb shell pm list packages > "$BACKUP_DIR/packages_all.txt"
    adb shell pm list packages --user 0 > "$BACKUP_DIR/packages_user0.txt"
    adb shell pm list packages -s > "$BACKUP_DIR/packages_system.txt"
    adb shell pm list packages -3 > "$BACKUP_DIR/packages_thirdparty.txt"
    adb shell pm list packages -d > "$BACKUP_DIR/packages_disabled.txt"

    {
        echo "Device: $(adb shell getprop ro.product.model)"
        echo "Android: $(adb shell getprop ro.build.version.release)"
        echo "Build: $(adb shell getprop ro.build.display.id)"
        echo "Security patch: $(adb shell getprop ro.build.version.security_patch)"
        echo "Date: $(date)"
    } > "$BACKUP_DIR/device_info.txt"

    log "${GREEN}Backup saved to $BACKUP_DIR/${NC}"
}

do_restore() {
    log "\n${BOLD}Restoring all debloated packages...${NC}\n"

    local all_packages=()
    all_packages+=("${GOOGLE_MEDIA_REMOVE[@]}")
    all_packages+=("${GOOGLE_PRODUCTIVITY_REMOVE[@]}")
    all_packages+=("${GOOGLE_EXTRAS_REMOVE[@]}")
    all_packages+=("${GOOGLE_OPTIONAL_REMOVE[@]}")
    all_packages+=("${GOOGLE_TELEMETRY_DISABLE[@]}")

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
            elif adb shell pm list packages 2>/dev/null | grep -q "^package:$pkg$"; then
                log "  ${GREEN}DISABLED${NC}   $pkg"
                ((disabled++))
            else
                log "  ${GREEN}REMOVED${NC}    $pkg"
                ((removed++))
            fi
        done
        echo
    }

    check_group "Google Media & Entertainment" "${GOOGLE_MEDIA_REMOVE[@]}"
    check_group "Google Productivity" "${GOOGLE_PRODUCTIVITY_REMOVE[@]}"
    check_group "Google Extras" "${GOOGLE_EXTRAS_REMOVE[@]}"
    check_group "Google Optional" "${GOOGLE_OPTIONAL_REMOVE[@]}"
    check_group "Google Telemetry" "${GOOGLE_TELEMETRY_DISABLE[@]}"

    log "${BOLD}Summary:${NC} ${GREEN}$removed removed${NC}, ${GREEN}$disabled disabled${NC}, ${YELLOW}$present still installed${NC}"
}

do_debloat() {
    log "\n${BOLD}=== Phase 1: Google Media & Entertainment ===${NC}\n"
    for pkg in "${GOOGLE_MEDIA_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 2: Google Productivity & Communication ===${NC}\n"
    for pkg in "${GOOGLE_PRODUCTIVITY_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 3: Google Services & Extras ===${NC}\n"
    for pkg in "${GOOGLE_EXTRAS_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 4: Disable Telemetry ===${NC}\n"
    for pkg in "${GOOGLE_TELEMETRY_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

do_optional() {
    log "\n${BOLD}=== Optional Removals (Assistant, Pay, TalkBack) ===${NC}\n"
    for pkg in "${GOOGLE_OPTIONAL_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done
}

do_privacy() {
    log "\n${BOLD}=== Privacy & Telemetry ADB Settings ===${NC}\n"

    if $DRY_RUN; then
        log "${CYAN}DRY RUN - showing commands only${NC}\n"
    fi

    log "${BOLD}Disable usage reporting:${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   settings put global usage_reporting_enabled 0"
        log "  ${CYAN}DRY${NC}   settings put secure user_setup_complete 1"
    else
        adb shell settings put global usage_reporting_enabled 0 2>/dev/null
        adb shell settings put secure user_setup_complete 1 2>/dev/null
        log "  ${GREEN}OK${NC}    Usage reporting disabled"
    fi

    log "\n${BOLD}Background location lockdown:${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   appops set --all ACCESS_BACKGROUND_LOCATION ignore"
        log "  ${CYAN}DRY${NC}   appops set com.google.android.gms ACCESS_BACKGROUND_LOCATION allow"
    else
        adb shell cmd appops set --all ACCESS_BACKGROUND_LOCATION ignore 2>/dev/null
        adb shell cmd appops set com.google.android.gms ACCESS_BACKGROUND_LOCATION allow 2>/dev/null
        log "  ${GREEN}OK${NC}    Background location locked down (GMS exempted)"
    fi

    log "\n${BOLD}Network traffic check:${NC}"
    log "  Current Google traffic:"
    adb shell dumpsys netstats 2>/dev/null | grep google | while read -r line; do
        log "    $line"
    done || log "  ${YELLOW}Could not read netstats${NC}"

    log "\n${BOLD}Manual steps (cannot be done via ADB):${NC}"
    log "  1. Settings > Privacy > Ads > Turn off all, reset ad ID"
    log "  2. Settings > Privacy > Activity controls > Turn off Web & App Activity"
    log "  3. Settings > Privacy > Activity controls > Turn off Location History"
    log "  4. Settings > Privacy > Activity controls > Turn off YouTube History"
    log "  5. Settings > Privacy > Usage & diagnostics > Turn OFF"
    log "  6. Settings > Privacy > Permission manager > Google Play services > Deny all"
    log "  7. Settings > Network > Private DNS > dns.adguard.com"
    log "  8. Install RethinkDNS from F-Droid for domain-level blocking"
}

do_battery() {
    log "\n${BOLD}=== Battery Optimisation ===${NC}\n"

    if $DRY_RUN; then
        log "${CYAN}DRY RUN - showing commands only${NC}\n"
    fi

    log "${BOLD}Animation speed (0.5x):${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   window_animation_scale 0.5"
        log "  ${CYAN}DRY${NC}   transition_animation_scale 0.5"
        log "  ${CYAN}DRY${NC}   animator_duration_scale 0.5"
    else
        adb shell settings put global window_animation_scale 0.5
        adb shell settings put global transition_animation_scale 0.5
        adb shell settings put global animator_duration_scale 0.5
        log "  ${GREEN}OK${NC}    Animations set to 0.5x"
    fi

    log "\n${BOLD}Deep doze:${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   dumpsys deviceidle enable"
    else
        adb shell dumpsys deviceidle enable 2>/dev/null && \
            log "  ${GREEN}OK${NC}    Deep doze enabled" || \
            log "  ${YELLOW}SKIP${NC}  Deep doze (may not be supported)"
    fi

    log "\n${BOLD}Background drain control:${NC}"
    local bg_deny_packages=(
        com.google.android.googlequicksearchbox
        com.google.android.apps.wellbeing
        com.google.android.feedback
        com.google.android.apps.turbo
    )
    for pkg in "${bg_deny_packages[@]}"; do
        if $DRY_RUN; then
            log "  ${CYAN}DRY${NC}   appops set $pkg RUN_IN_BACKGROUND deny"
        else
            adb shell cmd appops set "$pkg" RUN_IN_BACKGROUND deny 2>/dev/null && \
                log "  ${GREEN}OK${NC}    $pkg (background denied)" || \
                log "  ${YELLOW}SKIP${NC}  $pkg"
        fi
    done

    log "\n${BOLD}Manual steps (cannot be done via ADB):${NC}"
    log "  1. Settings > Battery > Adaptive preferences > Enable all"
    log "  2. Settings > Battery > Battery usage > Restrict background hogs"
    log "  3. Settings > System > Gestures > Disable Quick Tap, Lift to wake, Now Playing"
    log "  4. Settings > Location > Location services > Wi-Fi scanning OFF"
    log "  5. Settings > Location > Location services > Bluetooth scanning OFF"
    log "  6. Settings > Apps > Google Play services > Battery > Restricted"
}

show_help() {
    cat << 'HELP'
Google Pixel 8a - ADB Debloat & Privacy Script

Usage: ./pixel8a-debloat.sh [OPTIONS]

Options:
  --dry-run       Show what would be done without making changes
  --backup        Create a package backup before debloating
  --restore       Restore all previously removed/disabled packages
  --status        Show current debloat status for all tracked packages
  --optional      Also remove optional apps (Assistant, Pay, TalkBack)
  --privacy       Apply privacy/telemetry ADB settings + show manual steps
  --battery       Apply battery optimisation ADB settings + show manual steps
  --all           Run full debloat + optional + privacy + battery
  --help          Show this help message

Examples:
  ./pixel8a-debloat.sh --dry-run              # Preview changes
  ./pixel8a-debloat.sh --backup               # Backup + debloat Google apps
  ./pixel8a-debloat.sh --optional             # Also strip Assistant, Pay, etc.
  ./pixel8a-debloat.sh --all                  # Full clean + privacy + battery
  ./pixel8a-debloat.sh --status               # Check what's been removed
  ./pixel8a-debloat.sh --restore              # Undo everything

Notes:
  - All removals use "pm uninstall -k --user 0" (recoverable, keeps data)
  - Telemetry packages are disabled, not removed
  - Banking apps and Play Integrity are preserved
  - Safe to re-run after OTA updates
  - Logs are saved to ./pixel8a-debloat-*.log
HELP
}

# ─── Parse Arguments ─────────────────────────────────────────────────────────

for arg in "$@"; do
    case "$arg" in
        --dry-run)    DRY_RUN=true ;;
        --backup)     DO_BACKUP=true ;;
        --restore)    DO_RESTORE=true ;;
        --status)     DO_STATUS=true ;;
        --optional)   DO_OPTIONAL=true ;;
        --privacy)    DO_PRIVACY=true ;;
        --battery)    DO_BATTERY=true ;;
        --all)        DO_OPTIONAL=true; DO_PRIVACY=true; DO_BATTERY=true; DO_BACKUP=true ;;
        --help|-h)    show_help; exit 0 ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ─── Main ────────────────────────────────────────────────────────────────────

log "${BOLD}══════════════════════════════════════════════════════${NC}"
log "${BOLD}  Google Pixel 8a - ADB Debloat & Privacy${NC}"
log "${BOLD}══════════════════════════════════════════════════════${NC}"

if $DRY_RUN; then
    log "${YELLOW}DRY RUN MODE - no changes will be made${NC}"
fi

log ""
check_adb

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

# Run debloat
do_debloat

if $DO_OPTIONAL; then
    do_optional
fi

if $DO_PRIVACY; then
    do_privacy
fi

if $DO_BATTERY; then
    do_battery
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
    log "  1. Reboot the device:  adb reboot"
    log "  2. Open Play Store and let it update"
    log "  3. Test fingerprint unlock"
    log "  4. Test banking apps"
    log "  5. Test calls + SMS"
    log ""
    log "To check status later:  $0 --status"
    log "To undo everything:     $0 --restore"
fi
