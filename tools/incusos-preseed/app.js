/**
 * IncusOS Preseed Generator
 * Generates seed files for automated IncusOS installations
 */

(function() {
    'use strict';

    // DOM Elements
    const form = document.getElementById('preseed-form');
    const generateBtn = document.getElementById('generateBtn');
    const previewBtn = document.getElementById('previewBtn');
    const previewSection = document.getElementById('preview');
    const previewTabs = document.getElementById('previewTabs');
    const previewCode = document.getElementById('previewCode');
    const copyBtn = document.getElementById('copyBtn');
    const downloadFromPreview = document.getElementById('downloadFromPreview');

    // Collapsible section toggles
    document.querySelectorAll('.section-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !expanded);
            const content = toggle.nextElementSibling;
            content.classList.toggle('collapsed', expanded);
        });
    });

    // State
    let generatedFiles = {};
    let currentFile = null;

    /**
     * Collect form data into a structured object
     */
    function collectFormData() {
        return {
            imageType: document.querySelector('input[name="imageType"]:checked')?.value || 'iso',
            arch: document.querySelector('input[name="arch"]:checked')?.value || 'x86_64',
            application: document.querySelector('input[name="application"]:checked')?.value || 'incus',
            targetDrive: document.getElementById('targetDrive')?.value.trim() || '',
            wipeDrive: document.getElementById('wipeDrive')?.checked || false,
            autoReboot: document.getElementById('autoReboot')?.checked || true,
            applyDefaults: document.getElementById('applyDefaults')?.checked || true,
            clientCert: document.getElementById('clientCert')?.value.trim() || '',
            certName: document.getElementById('certName')?.value.trim() || 'admin',
            oidc: {
                issuer: document.getElementById('oidcIssuer')?.value.trim() || '',
                clientId: document.getElementById('oidcClientId')?.value.trim() || '',
                scopes: document.getElementById('oidcScopes')?.value.trim() || '',
                claim: document.getElementById('oidcClaim')?.value.trim() || ''
            },
            imageChannel: document.getElementById('imageChannel')?.value || 'stable',
            bootSecurity: document.querySelector('input[name="bootSecurity"]:checked')?.value || 'optimal',
            networkConfig: document.getElementById('networkConfig')?.value.trim() || ''
        };
    }

    /**
     * Generate YAML content for install.yaml
     */
    function generateInstallYaml(data) {
        const lines = ['# IncusOS Installation Configuration'];

        lines.push(`force_install: ${data.wipeDrive}`);
        lines.push(`force_reboot: ${data.autoReboot}`);

        // Target selection
        if (data.targetDrive) {
            lines.push('');
            lines.push('# Target drive selection');
            lines.push('target:');
            lines.push(`  id: "${data.targetDrive}"`);
        }

        // Security settings for degraded modes
        if (data.bootSecurity !== 'optimal') {
            lines.push('');
            lines.push('# Degraded security mode');
            lines.push('security:');
            if (data.bootSecurity === 'no-tpm') {
                lines.push('  tpm: false');
            } else if (data.bootSecurity === 'no-secureboot') {
                lines.push('  secureboot: false');
            }
        }

        return lines.join('\n');
    }

    /**
     * Generate YAML content for applications.yaml
     */
    function generateApplicationsYaml(data) {
        const lines = ['# Applications to install'];
        lines.push('applications:');
        lines.push(`  - ${data.application}`);
        return lines.join('\n');
    }

    /**
     * Generate YAML content for the application-specific preseed
     */
    function generateAppPreseedYaml(data) {
        const lines = [];

        if (data.application === 'incus') {
            lines.push('# Incus Application Preseed');
            lines.push(`apply_defaults: ${data.applyDefaults}`);

            // OIDC configuration
            if (data.oidc.issuer && data.oidc.clientId) {
                lines.push('');
                lines.push('# OIDC Authentication');
                lines.push('preseed:');
                lines.push('  config:');
                lines.push(`    oidc.issuer: "${data.oidc.issuer}"`);
                lines.push(`    oidc.client.id: "${data.oidc.clientId}"`);
                if (data.oidc.scopes) {
                    lines.push(`    oidc.scopes: "${data.oidc.scopes}"`);
                }
                if (data.oidc.claim) {
                    lines.push(`    oidc.claim: "${data.oidc.claim}"`);
                }
            }

            // Client certificate
            if (data.clientCert) {
                const hasPreseed = data.oidc.issuer && data.oidc.clientId;
                if (!hasPreseed) {
                    lines.push('');
                    lines.push('preseed:');
                }
                lines.push('  certificates:');
                lines.push(`    - name: "${data.certName}"`);
                lines.push('      type: client');
                lines.push('      certificate: |');
                // Indent certificate content
                const certLines = data.clientCert.split('\n');
                certLines.forEach(line => {
                    lines.push('        ' + line);
                });
            }
        } else if (data.application === 'operations-center') {
            lines.push('# Operations Center Preseed');
            lines.push('# Add your Operations Center configuration here');
            if (data.clientCert) {
                lines.push('');
                lines.push('certificates:');
                lines.push(`  - name: "${data.certName}"`);
                lines.push('    type: client');
                lines.push('    certificate: |');
                const certLines = data.clientCert.split('\n');
                certLines.forEach(line => {
                    lines.push('      ' + line);
                });
            }
        } else if (data.application === 'migration-manager') {
            lines.push('# Migration Manager Preseed');
            lines.push('# Add your Migration Manager configuration here');
            if (data.clientCert) {
                lines.push('');
                lines.push('certificates:');
                lines.push(`  - name: "${data.certName}"`);
                lines.push('    type: client');
                lines.push('    certificate: |');
                const certLines = data.clientCert.split('\n');
                certLines.forEach(line => {
                    lines.push('      ' + line);
                });
            }
        }

        return lines.join('\n');
    }

    /**
     * Generate YAML content for network.yaml (if custom config provided)
     */
    function generateNetworkYaml(data) {
        if (!data.networkConfig) return null;

        const lines = ['# Custom Network Configuration'];
        lines.push(data.networkConfig);
        return lines.join('\n');
    }

    /**
     * Generate all preseed files
     */
    function generatePreseedFiles() {
        const data = collectFormData();
        const files = {};

        // install.yaml
        files['install.yaml'] = generateInstallYaml(data);

        // applications.yaml
        files['applications.yaml'] = generateApplicationsYaml(data);

        // Application-specific preseed
        const appFilename = data.application === 'incus' ? 'incus.yaml' :
                           data.application === 'operations-center' ? 'operations-center.yaml' :
                           'migration-manager.yaml';
        files[appFilename] = generateAppPreseedYaml(data);

        // network.yaml (optional)
        const networkYaml = generateNetworkYaml(data);
        if (networkYaml) {
            files['network.yaml'] = networkYaml;
        }

        return files;
    }

    /**
     * Create TAR archive from files
     * Simple TAR implementation for POSIX ustar format
     */
    function createTarArchive(files) {
        const encoder = new TextEncoder();
        const chunks = [];

        for (const [filename, content] of Object.entries(files)) {
            const contentBytes = encoder.encode(content);
            const header = createTarHeader(filename, contentBytes.length);
            chunks.push(header);
            chunks.push(contentBytes);

            // Pad content to 512-byte boundary
            const padding = 512 - (contentBytes.length % 512);
            if (padding < 512) {
                chunks.push(new Uint8Array(padding));
            }
        }

        // End of archive marker (two 512-byte zero blocks)
        chunks.push(new Uint8Array(1024));

        // Combine all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    }

    /**
     * Create a TAR header for a file
     */
    function createTarHeader(filename, size) {
        const header = new Uint8Array(512);
        const encoder = new TextEncoder();

        // File name (0-99)
        const nameBytes = encoder.encode(filename.substring(0, 100));
        header.set(nameBytes, 0);

        // File mode (100-107) - 0644
        header.set(encoder.encode('0000644\0'), 100);

        // Owner UID (108-115)
        header.set(encoder.encode('0000000\0'), 108);

        // Owner GID (116-123)
        header.set(encoder.encode('0000000\0'), 116);

        // File size in octal (124-135)
        const sizeOctal = size.toString(8).padStart(11, '0') + ' ';
        header.set(encoder.encode(sizeOctal), 124);

        // Modification time (136-147) - current time
        const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + ' ';
        header.set(encoder.encode(mtime), 136);

        // Checksum placeholder (148-155) - spaces for calculation
        header.set(encoder.encode('        '), 148);

        // Type flag (156) - '0' for regular file
        header[156] = 48; // ASCII '0'

        // Link name (157-256) - empty for regular files

        // USTAR indicator (257-262)
        header.set(encoder.encode('ustar\0'), 257);

        // USTAR version (263-264)
        header.set(encoder.encode('00'), 263);

        // Owner user name (265-296)
        header.set(encoder.encode('root'), 265);

        // Owner group name (297-328)
        header.set(encoder.encode('root'), 297);

        // Calculate and set checksum
        let checksum = 0;
        for (let i = 0; i < 512; i++) {
            checksum += header[i];
        }
        const checksumOctal = checksum.toString(8).padStart(6, '0') + '\0 ';
        header.set(encoder.encode(checksumOctal), 148);

        return header;
    }

    /**
     * Download a blob as a file
     */
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show preview with generated files
     */
    function showPreview(files) {
        generatedFiles = files;
        previewSection.classList.remove('hidden');

        // Create tabs
        previewTabs.innerHTML = '';
        const filenames = Object.keys(files);

        filenames.forEach((filename, index) => {
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'preview-tab' + (index === 0 ? ' active' : '');
            tab.textContent = filename;
            tab.dataset.file = filename;
            tab.addEventListener('click', () => selectTab(filename));
            previewTabs.appendChild(tab);
        });

        // Show first file
        if (filenames.length > 0) {
            selectTab(filenames[0]);
        }

        // Scroll to preview
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Select a tab and show its content
     */
    function selectTab(filename) {
        currentFile = filename;

        // Update tab states
        previewTabs.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.file === filename);
        });

        // Show content
        previewCode.textContent = generatedFiles[filename] || '';
    }

    /**
     * Copy current file content to clipboard
     */
    async function copyToClipboard() {
        if (!currentFile || !generatedFiles[currentFile]) return;

        try {
            await navigator.clipboard.writeText(generatedFiles[currentFile]);
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<span class="copy-icon">&#x2713;</span> Copied!';

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<span class="copy-icon">&#x1F4CB;</span> Copy to Clipboard';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    /**
     * Generate and download TAR archive
     */
    function downloadTar() {
        const files = Object.keys(generatedFiles).length > 0 ?
                      generatedFiles :
                      generatePreseedFiles();

        const tarData = createTarArchive(files);
        const blob = new Blob([tarData], { type: 'application/x-tar' });
        downloadBlob(blob, 'seed.tar');
    }

    // Event Listeners
    generateBtn.addEventListener('click', () => {
        const files = generatePreseedFiles();
        downloadTar();
        showPreview(files);
    });

    previewBtn.addEventListener('click', () => {
        const files = generatePreseedFiles();
        showPreview(files);
    });

    copyBtn.addEventListener('click', copyToClipboard);
    downloadFromPreview.addEventListener('click', downloadTar);

})();
