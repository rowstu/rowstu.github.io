/**
 * Shared navigation component for rowstu.net
 * Include this file to add consistent navigation to any page
 */

(function() {
	'use strict';

	// Create navigation HTML
	const navHTML = `
		<nav id="rowstu-nav">
			<div class="nav-container">
				<a href="/" class="nav-logo">rowstu.net</a>
				<div class="nav-links">
					<a href="/index-classic.html" class="nav-link">Browse</a>
					<a href="/" class="nav-link">Terminal</a>
					<a href="https://github.com/rowstu" class="nav-link" target="_blank">GitHub</a>
				</div>
			</div>
		</nav>
	`;

	// Create navigation styles
	const navStyles = `
		<style id="rowstu-nav-styles">
			#rowstu-nav {
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				background: rgba(13, 17, 23, 0.95);
				backdrop-filter: blur(10px);
				border-bottom: 1px solid rgba(48, 54, 61, 0.5);
				z-index: 9999;
				padding: 0.75rem 0;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			}

			.nav-container {
				max-width: 1400px;
				margin: 0 auto;
				padding: 0 2rem;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}

			.nav-logo {
				font-family: 'JetBrains Mono', 'Recursive', monospace;
				font-weight: 700;
				font-size: 1.2rem;
				color: #00d9ff;
				text-decoration: none;
				transition: opacity 0.2s;
			}

			.nav-logo:hover {
				opacity: 0.8;
			}

			.nav-links {
				display: flex;
				gap: 1.5rem;
				align-items: center;
			}

			.nav-link {
				color: #8b949e;
				text-decoration: none;
				font-size: 0.95rem;
				font-weight: 500;
				transition: color 0.2s;
				font-family: 'Recursive', monospace;
			}

			.nav-link:hover {
				color: #00d9ff;
			}

			@media (max-width: 768px) {
				.nav-container {
					padding: 0 1rem;
				}

				.nav-links {
					gap: 1rem;
				}

				.nav-link {
					font-size: 0.85rem;
				}

				.nav-logo {
					font-size: 1rem;
				}
			}

			/* Add padding to body to account for fixed nav */
			body {
				padding-top: 60px !important;
			}
		</style>
	`;

	// Insert navigation when DOM is ready
	function insertNav() {
		// Add styles first
		document.head.insertAdjacentHTML('beforeend', navStyles);

		// Add navigation at the start of body
		document.body.insertAdjacentHTML('afterbegin', navHTML);
	}

	// Wait for DOM to be ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', insertNav);
	} else {
		insertNav();
	}
})();
