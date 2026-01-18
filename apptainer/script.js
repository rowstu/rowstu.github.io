// State management
const state = {
    packageIndex: {},
    selectedPackages: new Set(),
    indexReady: false
};

// Configuration
const BIOCONDA_CHANNEL = 'https://conda.anaconda.org/bioconda';
const SUBDIRS = ['linux-64', 'noarch'];

// DOM Elements
const elements = {
    statusBadge: document.getElementById('status-badge'),
    statusText: document.getElementById('status-text'),
    packageSearch: document.getElementById('package-search'),
    searchResults: document.getElementById('search-results'),
    selectedPackages: document.getElementById('selected-packages'),
    additionalPackages: document.getElementById('additional-packages'),
    baseImage: document.getElementById('base-image'),
    multiStage: document.getElementById('multi-stage'),
    stripBinaries: document.getElementById('strip-binaries'),
    removeStatic: document.getElementById('remove-static'),
    removeSymlinks: document.getElementById('remove-symlinks'),
    includeCyclonedx: document.getElementById('include-cyclonedx'),
    includeSpdx: document.getElementById('include-spdx'),
    customCommands: document.getElementById('custom-commands'),
    generateBtn: document.getElementById('generate-btn'),
    outputSection: document.getElementById('output-section'),
    definitionOutput: document.getElementById('definition-output'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn')
};

// Initialize the application
async function init() {
    await fetchPackageIndex();
    setupEventListeners();
    updateGenerateButton();
}

// Fetch Bioconda package index
async function fetchPackageIndex() {
    try {
        elements.statusText.textContent = 'Fetching package index...';

        for (const subdir of SUBDIRS) {
            const url = `${BIOCONDA_CHANNEL}/${subdir}/repodata.json`;

            try {
                const response = await fetch(url);
                if (!response.ok) continue;

                const data = await response.json();

                // Build package index
                for (const [filename, info] of Object.entries(data.packages || {})) {
                    const name = info.name;
                    if (!name) continue;

                    if (!state.packageIndex[name]) {
                        state.packageIndex[name] = {
                            name: name,
                            versions: [],
                            summary: info.summary || ''
                        };
                    }

                    if (info.version && !state.packageIndex[name].versions.includes(info.version)) {
                        state.packageIndex[name].versions.push(info.version);
                    }
                }
            } catch (err) {
                console.warn(`Failed to fetch ${subdir}:`, err);
            }
        }

        state.indexReady = true;
        const packageCount = Object.keys(state.packageIndex).length;

        elements.statusBadge.classList.remove('loading');
        elements.statusBadge.classList.add('ready');
        elements.statusText.textContent = `Ready • ${packageCount.toLocaleString()} packages`;

    } catch (error) {
        console.error('Error fetching package index:', error);
        elements.statusBadge.classList.remove('loading');
        elements.statusBadge.classList.add('error');
        elements.statusText.textContent = 'Failed to load package index';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search with debouncing
    let searchTimeout;
    elements.packageSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });

    // Generate button
    elements.generateBtn.addEventListener('click', generateDefinition);

    // Copy button
    elements.copyBtn.addEventListener('click', copyToClipboard);

    // Download button
    elements.downloadBtn.addEventListener('click', downloadDefinition);

    // Update button state when selections change
    elements.multiStage.addEventListener('change', () => {
        updateSingleStageOptions();
        updateGenerateButton();
    });

    updateSingleStageOptions();
}

// Update single-stage options based on multi-stage selection
function updateSingleStageOptions() {
    const isMultiStage = elements.multiStage.checked;
    elements.stripBinaries.disabled = isMultiStage;
    elements.removeStatic.disabled = isMultiStage;
    elements.removeSymlinks.disabled = isMultiStage;
}

// Search packages
function performSearch(query) {
    if (!state.indexReady || !query || query.length < 2) {
        elements.searchResults.innerHTML = '';
        elements.searchResults.style.display = 'none';
        return;
    }

    const results = searchPackages(query.toLowerCase(), 20);
    displaySearchResults(results);
}

// Search algorithm with ranking
function searchPackages(query, limit = 20) {
    const results = [];

    for (const [name, info] of Object.entries(state.packageIndex)) {
        const nameLower = name.toLowerCase();

        // Skip already selected packages
        if (state.selectedPackages.has(name)) continue;

        // Ranking: exact match > prefix match > substring match
        let score = 0;
        if (nameLower === query) {
            score = 3;
        } else if (nameLower.startsWith(query)) {
            score = 2;
        } else if (nameLower.includes(query)) {
            score = 1;
        }

        if (score > 0) {
            results.push({ ...info, score });
        }
    }

    // Sort by score (descending) then name (ascending)
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
    });

    return results.slice(0, limit);
}

// Display search results
function displaySearchResults(results) {
    if (results.length === 0) {
        elements.searchResults.innerHTML = '<div class="search-empty">No packages found</div>';
        elements.searchResults.style.display = 'block';
        return;
    }

    elements.searchResults.innerHTML = results.map(pkg => `
        <div class="search-result-item" data-package="${pkg.name}">
            <div class="search-result-info">
                <div class="search-result-name">${pkg.name}</div>
                <div class="search-result-summary">${pkg.summary || 'No description available'}</div>
            </div>
            <button class="btn-add" onclick="addPackage('${pkg.name}')">Add</button>
        </div>
    `).join('');

    elements.searchResults.style.display = 'block';
}

// Add package to selection
function addPackage(packageName) {
    state.selectedPackages.add(packageName);
    updateSelectedPackages();
    updateGenerateButton();

    // Clear search
    elements.packageSearch.value = '';
    elements.searchResults.innerHTML = '';
    elements.searchResults.style.display = 'none';
}

// Remove package from selection
function removePackage(packageName) {
    state.selectedPackages.delete(packageName);
    updateSelectedPackages();
    updateGenerateButton();
}

// Update selected packages display
function updateSelectedPackages() {
    if (state.selectedPackages.size === 0) {
        elements.selectedPackages.innerHTML = '<div class="empty-state">No packages selected yet</div>';
        return;
    }

    const packagesArray = Array.from(state.selectedPackages).sort();
    elements.selectedPackages.innerHTML = packagesArray.map(name => `
        <div class="selected-package-item">
            <span class="selected-package-name">${name}</span>
            <button class="btn-remove" onclick="removePackage('${name}')" title="Remove package">×</button>
        </div>
    `).join('');
}

// Update generate button state
function updateGenerateButton() {
    elements.generateBtn.disabled = !state.indexReady || state.selectedPackages.size === 0;
}

// Generate definition file
function generateDefinition() {
    const config = {
        baseImage: elements.baseImage.value,
        biocondaPackages: Array.from(state.selectedPackages),
        additionalPackages: elements.additionalPackages.value.trim().split(/\s+/).filter(p => p),
        customCommands: elements.customCommands.value.trim(),
        multiStage: elements.multiStage.checked,
        stripBinaries: elements.stripBinaries.checked,
        removeStatic: elements.removeStatic.checked,
        removeSymlinks: elements.removeSymlinks.checked,
        includeCyclonedx: elements.includeCyclonedx.checked,
        includeSpdx: elements.includeSpdx.checked
    };

    const definition = config.multiStage
        ? generateMultistageDefinition(config)
        : generateSingleStageDefinition(config);

    // Display output
    elements.definitionOutput.textContent = definition;
    elements.outputSection.style.display = 'block';

    // Smooth scroll to output
    elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Generate single-stage definition
function generateSingleStageDefinition(config) {
    const baseImageMap = {
        'mambaforge': 'condaforge/mambaforge:latest',
        'debian': 'debian:bookworm-slim'
    };

    const biocondaList = config.biocondaPackages.join(' ');
    const additionalList = config.additionalPackages.join(' ');

    let def = `Bootstrap: docker
From: ${baseImageMap[config.baseImage] || baseImageMap['mambaforge']}

%labels
    Author Bioconda Definition Generator
    Version 1.4
    Description Bioconda container with: ${config.biocondaPackages.join(', ')}

%post
    set -e

    echo "Setting up environment..."
`;

    if (config.baseImage === 'debian') {
        def += `
    # Install micromamba
    apt-get update && apt-get install -y wget bzip2
    wget -qO- https://micro.mamba.pm/api/micromamba/linux-64/latest | tar -xvj bin/micromamba
    mv bin/micromamba /usr/local/bin/
    rm -rf bin

    # Initialize micromamba
    micromamba config append channels defaults
    micromamba config append channels bioconda
    micromamba config append channels conda-forge
    micromamba config set channel_priority strict
`;
    } else {
        def += `
    # Configure conda channels
    conda config --add channels defaults
    conda config --add channels bioconda
    conda config --add channels conda-forge
    conda config --set channel_priority strict
`;
    }

    if (config.biocondaPackages.length > 0) {
        def += `
    echo "Installing bioconda packages: ${biocondaList}"
`;
        if (config.baseImage === 'debian') {
            def += `    micromamba install -y -n base ${biocondaList}
`;
        } else {
            def += `    mamba install -y ${biocondaList}
`;
        }
    }

    if (config.additionalPackages.length > 0) {
        def += `
    echo "Installing additional packages: ${additionalList}"
`;
        if (config.baseImage === 'debian') {
            def += `    micromamba install -y -n base ${additionalList}
`;
        } else {
            def += `    mamba install -y ${additionalList}
`;
        }
    }

    if (config.customCommands) {
        def += `
    echo "Running custom commands..."
    ${config.customCommands}
`;
    }

    // Size reduction options
    if (config.stripBinaries || config.removeStatic || config.removeSymlinks) {
        def += `
    echo "Applying size reduction steps..."
`;
        if (config.stripBinaries) {
            def += `    find /opt/conda/bin -type f -executable -exec strip --strip-all {} \\; 2>/dev/null || true
    find /opt/conda/lib -type f -name "*.so*" -exec strip --strip-unneeded {} \\; 2>/dev/null || true
`;
        }
        if (config.removeStatic) {
            def += `    find /opt/conda -name "*.a" -delete
`;
        }
        if (config.removeSymlinks) {
            def += `    find /opt/conda -xtype l -delete
`;
        }
    }

    // SBOM generation instructions
    if (config.includeCyclonedx || config.includeSpdx) {
        def += `
    echo "SBOM generation note:"
    echo "After building the container, generate SBOMs with:"
`;
        if (config.includeCyclonedx) {
            def += `    echo "  syft scan singularity:container.sif -o cyclonedx-json=sbom-cyclonedx.json"
`;
        }
        if (config.includeSpdx) {
            def += `    echo "  syft scan singularity:container.sif -o spdx-json=sbom-spdx.json"
`;
        }
    }

    def += `
    # Cleanup
    ${config.baseImage === 'debian' ? 'micromamba' : 'conda'} clean --all -y
    apt-get clean 2>/dev/null || true
    rm -rf /root/.cache

    echo "Build complete!"

%environment
    export PATH=/opt/conda/bin:$PATH
    export SHELL=/bin/bash

%runscript
    exec "$@"
`;

    return def;
}

// Generate multi-stage definition
function generateMultistageDefinition(config) {
    const biocondaList = config.biocondaPackages.join(' ');
    const additionalList = config.additionalPackages.join(' ');
    const allPackages = [...config.biocondaPackages, ...config.additionalPackages].join(' ');

    let def = `Bootstrap: docker
From: busybox:musl
Stage: ishell


Bootstrap: docker
From: docker.io/condaforge/mambaforge
Stage: ibuild

%post
  APPDIR=/app/conda

  # Install packages with mamba in the correct APPDIR
  mamba create -q -y -c bioconda -p $APPDIR ${allPackages}
  mamba clean -a -q -y
  mamba list -p $APPDIR --export > $APPDIR/environment

  # Remove unnecessary files before moving to reduce size
  # Remove Python bytecode and cache
  find $APPDIR -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR -type f -name "*.pyc" -delete 2>/dev/null || true
  find $APPDIR -type f -name "*.pyo" -delete 2>/dev/null || true

  # Remove Python development and unnecessary modules
  find $APPDIR/lib -type d -name "ensurepip" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -type d -name "idlelib" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -type d -name "pydoc_data" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -type d -name "tkinter" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -type d -name "turtle" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -type d -name "turtledemo" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR/lib -name "config-*-linux-gnu" -type d -exec rm -rf {} + 2>/dev/null || true

  # Remove test files and directories
  find $APPDIR -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR -type d -name "testing" -exec rm -rf {} + 2>/dev/null || true
  find $APPDIR -type f -name "test_*.py" -delete 2>/dev/null || true

  # Remove documentation and man pages
  rm -rf $APPDIR/share/man 2>/dev/null || true
  rm -rf $APPDIR/share/doc 2>/dev/null || true
  rm -rf $APPDIR/share/gtk-doc 2>/dev/null || true
  rm -rf $APPDIR/share/info 2>/dev/null || true

  # Remove Perl documentation (pod files)
  find $APPDIR/lib/perl5 -type f -name "*.pod" -delete 2>/dev/null || true
  find $APPDIR/lib/perl5 -type d -name "pod" -exec rm -rf {} + 2>/dev/null || true

  # Remove locale/translation files (keep minimal English)
  find $APPDIR/share/locale -mindepth 1 -maxdepth 1 ! -name 'en*' -exec rm -rf {} + 2>/dev/null || true

  # Remove include files (C/C++ headers not needed at runtime)
  rm -rf $APPDIR/include 2>/dev/null || true

  # Remove pkg-config and cmake files
  rm -rf $APPDIR/lib/pkgconfig 2>/dev/null || true
  rm -rf $APPDIR/share/pkgconfig 2>/dev/null || true
  rm -rf $APPDIR/lib/cmake 2>/dev/null || true
  rm -rf $APPDIR/share/cmake 2>/dev/null || true

  # Remove conda package cache and tarballs
  rm -rf $APPDIR/pkgs 2>/dev/null || true

  # Now let's move to '/app' as workdir to workaround apptainer's peculiarities
  mkdir -p /app
  mkdir -p /app/share
  mv $APPDIR/bin /app/
  mv $APPDIR/lib /app/
  # Move package-specific share directories if they exist
  for pkg in ${biocondaList}; do
    if [ -d "$APPDIR/share/$pkg" ]; then
      mv $APPDIR/share/$pkg /app/share/ || true
    fi
  done
  mv $APPDIR/conda-meta /app/
  mv $APPDIR/environment /app/

  # Save package information
  echo "${biocondaList}" > /app/app.packages
`;

    // Add custom commands if provided
    if (config.customCommands) {
        def += `
  # Custom commands
${config.customCommands}
`;
    }

    def += `
  # Make apptainer happy by removing any dangling link
  find /app -xtype l -exec rm {} \\;


Bootstrap: docker
From: alpine
Stage: istrip

%files from ibuild
  /app /app

%post
  # Strip binaries and remove static libraries for significant size reduction
  # For example, prokka reduces by 20% with this step
  apk add --no-cache binutils

  # Strip all executables and libraries (be aggressive)
  find /app/bin -type f -executable -exec strip --strip-all {} \\; 2> /dev/null || true
  find /app/lib -type f -name "*.so*" -exec strip --strip-unneeded {} \\; 2> /dev/null || true

  # Remove static libraries
  find /app/lib -name "*.a" -delete 2> /dev/null || true

  # Remove additional unnecessary files
  find /app -type f -name "*.la" -delete 2> /dev/null || true
  find /app -type f -name "*.pyx" -delete 2> /dev/null || true
  find /app -type f -name "*.pxd" -delete 2> /dev/null || true
  find /app -type f -name "*.h" -delete 2> /dev/null || true
  find /app -type f -name "*.hpp" -delete 2> /dev/null || true

  # Remove any remaining Python cache and compiled files
  find /app -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
  find /app -type f -name "*.pyc" -delete 2>/dev/null || true
  find /app -type f -name "*.pyo" -delete 2> /dev/null || true

  # Remove remaining test files that might have slipped through
  find /app -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
  find /app -type d -name "test" -exec rm -rf {} + 2>/dev/null || true


Bootstrap: docker
From: gcr.io/distroless/base-debian12
Stage: ipack

%files from ishell
  /bin/* /bin
  /usr/bin/* /usr/bin

%files from istrip
  /app /app

%post
  APPDIR=/app/conda
  PACKAGES="$(cat /app/app.packages)"

  echo "export PACKAGES=\\"\${PACKAGES}\\"" >> \$APPTAINER_ENVIRONMENT
  echo "export PATH=\\"/app/bin:\${PATH}\\"" >> \$APPTAINER_ENVIRONMENT

  echo "app.packages \${PACKAGES}" >> \$APPTAINER_LABELS

  ln -s /app \$APPDIR

  # Create a minimal bash wrapper for compatibility
  echo "#!/bin/sh" > /bin/bash
  echo "exec /bin/sh \\\$@" >> /bin/bash
  echo "" >> /bin/bash

  chmod a+x /bin/bash
  chmod go+r /bin/bash
  chmod go-w /bin/bash

%runscript
  echo "Arguments received: \$*"
  exec "\$@"
`;

    // SBOM generation instructions
    if (config.includeCyclonedx || config.includeSpdx) {
        def += `
# SBOM Generation:
# After building the container, generate SBOMs with:
`;
        if (config.includeCyclonedx) {
            def += `# syft scan singularity:container.sif -o cyclonedx-json=sbom-cyclonedx.json
`;
        }
        if (config.includeSpdx) {
            def += `# syft scan singularity:container.sif -o spdx-json=sbom-spdx.json
`;
        }
    }

    return def;
}

// Copy to clipboard
async function copyToClipboard() {
    const text = elements.definitionOutput.textContent;

    try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for non-HTTPS contexts (like HTTP over LAN)
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textArea);
            }
        }

        // Visual feedback
        const originalText = elements.copyBtn.querySelector('.btn-text').textContent;
        elements.copyBtn.querySelector('.btn-text').textContent = 'Copied!';
        elements.copyBtn.classList.add('success');

        setTimeout(() => {
            elements.copyBtn.querySelector('.btn-text').textContent = originalText;
            elements.copyBtn.classList.remove('success');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please select and copy the text manually.');
    }
}

// Download definition file
function downloadDefinition() {
    const text = elements.definitionOutput.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'bioconda-container.def';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
