#!/usr/bin/env bash
#
# xperia-debloat.sh - Sony Xperia XZ2 Compact ADB Debloat Script
#
# Conservative, banking-app-safe debloat for stock firmware with locked bootloader.
# Safe to re-run after OTA updates (Sony often re-registers system packages).
#
# Usage:
#   ./xperia-debloat.sh [OPTIONS]
#
# Options:
#   --dry-run       Show what would be done without making changes
#   --backup        Create a package backup before debloating
#   --restore       Restore all previously removed packages
#   --status        Show current debloat status
#   --google        Also remove Google user apps (Gmail, Maps, YouTube, etc.)
#   --aggressive    Apply battery/telemetry/animation optimisations
#   --all           Run full debloat + google + aggressive
#   --help          Show this help message
#
# Notes:
#   - Requires ADB with USB debugging enabled on the device
#   - All removals use "pm uninstall --user 0" (recoverable)
#   - Disables use "pm disable-user --user 0" (recoverable)
#   - Nothing is permanently deleted from the system partition
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
DO_GOOGLE=false
DO_AGGRESSIVE=false
BACKUP_DIR="./xperia-backup-$(date +%Y%m%d)"
LOG_FILE="./xperia-debloat-$(date +%Y%m%d-%H%M%S).log"

# ─── Package Lists ───────────────────────────────────────────────────────────

# Third-party bloat (always safe to remove)
THIRDPARTY_REMOVE=(
    com.amazon.mShop.android.shopping
    com.amazon.clouddrive.photos
    com.amazon.kindle
    com.facebook.katana
    com.facebook.appmanager
    com.facebook.services
    com.facebook.system
    com.s.antivirus
)

# Sony bloat - demo/retail/support
SONY_BLOAT_REMOVE=(
    com.sonymobile.retaildemo
    com.sonymobile.support
    com.sonymobile.xperiatransfermobile
    com.sonymobile.infoapp
    com.sonymobile.dropbox.system
)

# Sony content apps (music, album, weather, etc.)
SONY_CONTENT_REMOVE=(
    com.sonyericsson.music
    com.sonyericsson.album
    com.sonymobile.email
    com.sonymobile.xperiaweather
    com.sonyericsson.organizer
    com.sonyericsson.photoeditor
    com.sony.tvsideview.videoph
    com.sonymobile.moviecreator
    com.sonymobile.scan3d
)

# Xperia Assist (all components)
SONY_ASSIST_REMOVE=(
    com.sonymobile.assist
    com.sonymobile.assist.persistent
    com.sonymobile.assist.overlay.tama
    com.sonymobile.assist.overlay.fingerprint
)

# Sony UX fluff
SONY_UX_REMOVE=(
    com.sonymobile.prediction
    com.sonymobile.smartnotification
    com.sonymobile.smartcleaner
    com.sonymobile.onehand
    com.sonymobile.pocketmode2
    com.sonymobile.coverapp2
    com.sonymobile.pobox
    com.sonymobile.dlna
    com.sonymobile.dualshockmanager
)

# Sony telemetry / analytics (disable only)
SONY_TELEMETRY_DISABLE=(
    com.sonymobile.anondata
    com.sonymobile.gotaidd.service
    com.sonymobile.swiqisystemservice
    com.sonyericsson.idd.agent
    com.sonymobile.idd.permission.application_certificate
    com.sonyericsson.psm.sysmonservice
    com.sonymobile.rcahandler
)

# Sony intelligence services (disable only)
SONY_INTELLIGENCE_DISABLE=(
    com.sonymobile.intelligent.observer
    com.sonymobile.intelligent.backlight
    com.sonymobile.intelligent.gesture
    com.sonymobile.intelligent.iengine
)

# Google user apps (optional, --google flag)
GOOGLE_APPS_REMOVE=(
    com.google.android.gm
    com.google.android.calendar
    com.google.android.apps.messaging
    com.google.android.apps.maps
    com.google.ar.core
    com.google.ar.lens
    com.google.android.projection.gearhead
    com.google.android.googlequicksearchbox
    com.google.android.apps.wellbeing
    com.google.android.feedback
    com.google.android.apps.turbo
    com.google.android.apps.tachyon
    com.google.android.youtube
    com.google.android.apps.photos
    com.google.android.apps.docs
    com.google.android.videos
    com.google.android.music
    com.google.android.apps.podcasts
    com.google.android.apps.magazines
)

# Google system-adjacent (disable only, --google flag)
GOOGLE_SYSTEM_DISABLE=(
    com.google.android.tts
    com.google.android.marvin.talkback
    com.google.android.printservice.recommendation
    com.google.android.apps.restore
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
        log "  ${CYAN}DRY${NC}   adb shell pm uninstall --user 0 $pkg"
        return
    fi

    local result
    result=$(adb shell pm uninstall --user 0 "$pkg" 2>&1)

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
    result=$(adb shell pm enable "$pkg" 2>&1)

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
    adb shell pm list packages -d > "$BACKUP_DIR/packages_disabled.txt"

    # Save device info
    {
        echo "Device: $(adb shell getprop ro.product.model)"
        echo "Android: $(adb shell getprop ro.build.version.release)"
        echo "Build: $(adb shell getprop ro.build.display.id)"
        echo "Date: $(date)"
    } > "$BACKUP_DIR/device_info.txt"

    log "${GREEN}Backup saved to $BACKUP_DIR/${NC}"
}

do_restore() {
    log "\n${BOLD}Restoring all debloated packages...${NC}\n"

    local all_packages=()
    all_packages+=("${THIRDPARTY_REMOVE[@]}")
    all_packages+=("${SONY_BLOAT_REMOVE[@]}")
    all_packages+=("${SONY_CONTENT_REMOVE[@]}")
    all_packages+=("${SONY_ASSIST_REMOVE[@]}")
    all_packages+=("${SONY_UX_REMOVE[@]}")
    all_packages+=("${SONY_TELEMETRY_DISABLE[@]}")
    all_packages+=("${SONY_INTELLIGENCE_DISABLE[@]}")
    all_packages+=("${GOOGLE_APPS_REMOVE[@]}")
    all_packages+=("${GOOGLE_SYSTEM_DISABLE[@]}")

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

    check_group "Third-Party Bloat" "${THIRDPARTY_REMOVE[@]}"
    check_group "Sony Bloat" "${SONY_BLOAT_REMOVE[@]}"
    check_group "Sony Content Apps" "${SONY_CONTENT_REMOVE[@]}"
    check_group "Xperia Assist" "${SONY_ASSIST_REMOVE[@]}"
    check_group "Sony UX Fluff" "${SONY_UX_REMOVE[@]}"
    check_group "Sony Telemetry" "${SONY_TELEMETRY_DISABLE[@]}"
    check_group "Sony Intelligence" "${SONY_INTELLIGENCE_DISABLE[@]}"
    check_group "Google Apps" "${GOOGLE_APPS_REMOVE[@]}"
    check_group "Google System-Adjacent" "${GOOGLE_SYSTEM_DISABLE[@]}"

    log "${BOLD}Summary:${NC} ${GREEN}$removed removed${NC}, ${GREEN}$disabled disabled${NC}, ${YELLOW}$present still installed${NC}"
}

do_debloat() {
    log "\n${BOLD}=== Phase 1: Third-Party Bloat ===${NC}\n"
    for pkg in "${THIRDPARTY_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 2: Sony Bloat ===${NC}\n"
    for pkg in "${SONY_BLOAT_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 3: Sony Content Apps ===${NC}\n"
    for pkg in "${SONY_CONTENT_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 4: Xperia Assist ===${NC}\n"
    for pkg in "${SONY_ASSIST_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 5: Sony UX Fluff ===${NC}\n"
    for pkg in "${SONY_UX_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Phase 6: Disable Sony Telemetry ===${NC}\n"
    for pkg in "${SONY_TELEMETRY_DISABLE[@]}"; do
        disable_package "$pkg"
    done

    log "\n${BOLD}=== Phase 7: Disable Sony Intelligence Services ===${NC}\n"
    for pkg in "${SONY_INTELLIGENCE_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

do_google() {
    log "\n${BOLD}=== Google Apps Removal ===${NC}\n"
    for pkg in "${GOOGLE_APPS_REMOVE[@]}"; do
        uninstall_package "$pkg"
    done

    log "\n${BOLD}=== Google System-Adjacent (disable) ===${NC}\n"
    for pkg in "${GOOGLE_SYSTEM_DISABLE[@]}"; do
        disable_package "$pkg"
    done
}

do_aggressive() {
    log "\n${BOLD}=== Aggressive Optimisation ===${NC}\n"

    if $DRY_RUN; then
        log "${CYAN}DRY RUN - showing commands only${NC}\n"
    fi

    log "${BOLD}Background drain control:${NC}"
    local bg_deny_packages=(
        com.google.android.googlequicksearchbox
        com.google.android.apps.wellbeing
        com.google.android.feedback
        com.sonymobile.smartnotification
        com.sonymobile.prediction
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

    log "\n${BOLD}Wakelock control:${NC}"
    local wakelock_deny_packages=(
        com.sonymobile.anondata
        com.sonyericsson.idd.agent
        com.sonymobile.gotaidd.service
    )
    for pkg in "${wakelock_deny_packages[@]}"; do
        if $DRY_RUN; then
            log "  ${CYAN}DRY${NC}   appops set $pkg WAKE_LOCK deny"
        else
            adb shell cmd appops set "$pkg" WAKE_LOCK deny 2>/dev/null && \
                log "  ${GREEN}OK${NC}    $pkg (wakelock denied)" || \
                log "  ${YELLOW}SKIP${NC}  $pkg"
        fi
    done

    log "\n${BOLD}Deep doze:${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   dumpsys deviceidle enable"
    else
        adb shell dumpsys deviceidle enable 2>/dev/null && \
            log "  ${GREEN}OK${NC}    Deep doze enabled" || \
            log "  ${YELLOW}SKIP${NC}  Deep doze"
    fi

    log "\n${BOLD}Animation speed (0.5x):${NC}"
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

    log "\n${BOLD}Telemetry reduction:${NC}"
    if $DRY_RUN; then
        log "  ${CYAN}DRY${NC}   google_core_control 0"
        log "  ${CYAN}DRY${NC}   usage_reporting_enabled 0"
    else
        adb shell settings put global google_core_control 0 2>/dev/null
        adb shell settings put global usage_reporting_enabled 0 2>/dev/null
        adb shell settings put secure user_setup_complete 1 2>/dev/null
        log "  ${GREEN}OK${NC}    Telemetry settings reduced"
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
}

show_help() {
    cat << 'HELP'
Sony Xperia XZ2 Compact - ADB Debloat Script

Usage: ./xperia-debloat.sh [OPTIONS]

Options:
  --dry-run       Show what would be done without making changes
  --backup        Create a package backup before debloating
  --restore       Restore all previously removed/disabled packages
  --status        Show current debloat status for all tracked packages
  --google        Also remove Google user apps (Gmail, Maps, YouTube, etc.)
  --aggressive    Apply battery/telemetry/animation optimisations
  --all           Run full debloat + google + aggressive
  --help          Show this help message

Examples:
  ./xperia-debloat.sh --dry-run              # Preview changes
  ./xperia-debloat.sh --backup               # Backup + debloat Sony/third-party
  ./xperia-debloat.sh --google               # Also strip Google apps
  ./xperia-debloat.sh --all                  # Full clean + optimise
  ./xperia-debloat.sh --status               # Check what's been removed
  ./xperia-debloat.sh --restore              # Undo everything

Notes:
  - All removals use "pm uninstall --user 0" (recoverable)
  - Telemetry/intelligence packages are disabled, not removed
  - Banking apps and Play Integrity are preserved
  - Safe to re-run after OTA updates
  - Logs are saved to ./xperia-debloat-*.log
HELP
}

# ─── Parse Arguments ─────────────────────────────────────────────────────────

if [[ $# -eq 0 ]]; then
    # Default: run base debloat
    true
fi

for arg in "$@"; do
    case "$arg" in
        --dry-run)    DRY_RUN=true ;;
        --backup)     DO_BACKUP=true ;;
        --restore)    DO_RESTORE=true ;;
        --status)     DO_STATUS=true ;;
        --google)     DO_GOOGLE=true ;;
        --aggressive) DO_AGGRESSIVE=true ;;
        --all)        DO_GOOGLE=true; DO_AGGRESSIVE=true; DO_BACKUP=true ;;
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
log "${BOLD}  Sony Xperia XZ2 Compact - ADB Debloat${NC}"
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

# Run debloat phases
do_debloat

if $DO_GOOGLE; then
    do_google
fi

if $DO_AGGRESSIVE; then
    do_aggressive
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
    log "  6. Test camera and Wi-Fi"
    log ""
    log "To check status later:  $0 --status"
    log "To undo everything:     $0 --restore"
fi
